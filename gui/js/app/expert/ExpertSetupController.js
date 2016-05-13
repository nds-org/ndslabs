/* global angular:false */

angular
.module('ndslabs')
/**
 * The main view of our app, this controller houses the
 * "Deploy" and "Manage" portions of the interface
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ExpertSetupController', [ '$scope', '$log', '$location', '$interval', '$q', '$uibModal', '_', 'AuthInfo', 'Project', 'Volumes', 'Stacks', 'Specs', 'AutoRefresh', 'SoftRefresh',
    'StackService', 'NdsLabsApi', function($scope, $log, $location, $interval, $q, $uibModal, _, AuthInfo, Project, Volumes, Stacks, Specs, AutoRefresh, SoftRefresh, 
    StackService, NdsLabsApi) {
  
  // Grab our projectId from the login page
  var projectId = AuthInfo.get().namespace;
  
  /** 
   * FIXME: Temporary hack to update $scope when service data changes.
   * I am hoping asynchronous updates will allow me to remove this/these hack(s)
   */
  var sync = {};
  sync.project = function(newValue, oldValue) { $scope.project = Project.project; };
  sync.specs = function(newValue, oldValue) { $scope.allServices = Specs.all; };
  sync.stacks = function(newValue, oldValue) { $scope.configuredStacks = Stacks.all; };
  sync.volumes = function(newValue, oldValue) { $scope.configuredVolumes = Volumes.all; };
   
  $scope.$watch(function () { return Project.project }, sync.project);
  $scope.$watch(function () { return Specs.all }, sync.specs);
  $scope.$watch(function () { return Stacks.all }, sync.stacks);
  $scope.$watch(function () { return Volumes.all }, sync.volumes);
  
  /**
   * Selects the given volume (highlight it in the 'Volumes' grid)
   */
  $scope.selectVolume = function(volume) {
    $scope.selectedVolume = volume.id;
    $scope.selectedTab = 1;
  };

  // Accounting stuff
  $scope.svcQuery = '';
  $scope.autoRefresh = AutoRefresh;
  
  // Watch for transitioning stacks (their status will end with "ing")
  $scope.$watch('configuredStacks', function(oldValue, newValue) {
    var transient = _.find(Stacks.all, function(stk) {
      return _.includes(stk.status, 'ing');
    });
    
    if (!transient && AutoRefresh.interval) {
      AutoRefresh.stop();
    } else if (transient && !AutoRefresh.interval) {
      AutoRefresh.start();
    }
  });
  
  $scope.starting = {};
  $scope.stopping = {};
  
  /**
   * Starts the given stack's services one-by-one and does a "soft-refresh" when complete
   * @param {Object} stack - the stack to launch
   */ 
  $scope.startStack = function(stack) {
    AutoRefresh.start();
    $scope.starting[stack.id] = true;
    
    // Then send the "start" command to the API server
    NdsLabsApi.getProjectsByProjectIdStartByStackId({
      'projectId': projectId,
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully started ' + stack.name);
    }, function(headers) {
      $log.error('failed to start ' + stack.name);
    }).finally(function() {
      $scope.starting[stack.id] = false;
    });
  };
  
  /**
   * Stops the given stack's services one-by-one and does a "soft-refresh" when complete
   * @param {Object} stack - the stack to shut down
   */ 
  $scope.stopStack = function(stack) {
    // See 'app/expert/stackStop/stackStop.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/expert/stackStop/stackStop.html',
      controller: 'StackStopCtrl',
      size: 'md',
      keyboard: false,
      backdrop: 'static',
      resolve: {
        stack: function() { return stack; },
      }
    });

    // Define what we should do when the modal is closed
    modalInstance.result.then(function(stack) {
      AutoRefresh.start();
      $scope.stopping[stack.id] = true;
    
      // Then send the "stop" command to the API server
      NdsLabsApi.getProjectsByProjectIdStopByStackId({
        'projectId': projectId,
        'stackId': stack.id
      }).then(function(data, xhr) {
        $log.debug('successfully stopped ' + stack.name);
      }, function(headers) {
        $log.error('failed to stop ' + stack.name);
      })
      .finally(function() {
        $scope.stopping[stack.id] = false;
      });
    });
  };
  
  /** 
   * Add a service to a stopped stack 
   * @param {Object} stack - the stack to add the service to
   * @param {Object} service - the new service to add
   */
  $scope.addStackSvc = function(stack, svc) {
    /** Add dependencies, then the service itself, then PUT */
    var performAdd = function(service, config) {
      // Add this service to our stack locally
      var svcSpec = _.find(Specs.all, [ 'key', service.key ]);

      // Add any new required dependencies introduced
      // TODO: What if dependencies require a volume??
      angular.forEach(spec.depends, function(dependency) {
        var key = dependency.key;
        
        // Check if required dependency has already been added to our proposed stack
        if (dependency.required && !_.find(stack.services, function(svc) { return svc.service === key })) {
          // Add the service if it has not
          var spec = _.find(Specs.all, [ 'key',  key ]);
          stack.services.push(new StackService(stack, spec));
        } else {
          // Skip this service if we see it in the list already
          $log.debug("Skipping duplicate service: " + svc.key);
        }
      });
      
      // Now that we have all required dependencies, add our target service
      var newService = new StackService(stack, svcSpec);
      if (config) {
        newService.config = config;
      }
      stack.services.push(newService);
      
      // Then update the entire stack in etcd
      return NdsLabsApi.putProjectsByProjectIdStacksByStackId({
        'stack': stack,
        'projectId': projectId,
        'stackId': stack.id
      }).then(function(data, xhr) {
        $log.debug('successfully added service ' + service.key + ' to stack ' + stack.name);
        stack = data;
      }, function(headers) {
        $log.error('failed to add service ' + service.key + ' to stack ' + stack.name);
        
        // Restore our state from etcd
        Stacks.populate(projectId);
      });
    }
    
    var spec = _.find(Specs.all, [ 'key', svc.key ]);
    var mounts = _.filter(spec.volumeMounts, function(mnt) { return mnt.name != 'docker'; });
    var config = spec.config;
    
    if (mounts.length > 0 || config) {
      // See 'app/expert/addService/addService.html'
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/expert/addService/addService.html',
        controller: 'AddServiceCtrl',
        size: 'md',
        keyboard: false,
        backdrop: 'static',
        resolve: {
          stack: function() { return stack; },
          service: function() { return svc; }
        }
      });
      
      // If user pressed "Confirm", attempt to add the configured service to the stack
      modalInstance.result.then(function(result) {
        performAdd(result.spec, result.config).then(function() {
          Stacks.populate(projectId).then(function() {
            attachOrCreateVolumes(stack, result.volumes).then(function() {
              Volumes.populate(projectId);
            });
          });
        });
      });
    } else {
      performAdd(svc);
    }
  };
  
  /** 
   * Remove a service from a stopped stack 
   * @param {Object} stack - the stack to remove the service from
   * @param {Object} service - the service to remove
   */
  $scope.removeStackSvc = function(stack, svc) {
    // Remove this services locally
    stack.services.splice(stack.services.indexOf(svc), 1);
    
    // Then update the entire stack in etcd
    NdsLabsApi.putProjectsByProjectIdStacksByStackId({
      'stack': stack,
      'projectId': projectId,
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully removed service ' + svc.service + ' from stack ' + stack.name);
    }, function(headers) {
      $log.error('failed to remove service ' + svc.service + ' from stack ' + stack.name);
      
      // Restore our state from etcd
      Stacks.populate(projectId);
    });
  };
  
  /**
   * Opens the Configuration Wizard to configure and add a new stack
   * @param {Object} spec - the spec to use to create a new stack
   */ 
  $scope.openWizard = function(spec) {
    // See 'app/expert/configWizard/configurationWizard.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/expert/configWizard/configurationWizard.html',
      controller: 'ConfigurationWizardCtrl',
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      resolve: {
        template: function() { return spec; },
        configuredVolumes: function() { return $scope.configuredVolumes; },
        configuredStacks: function() { return $scope.configuredStacks; }
      }
    });

    // Define what we should do when the modal is closed
    modalInstance.result.then(function(newEntities) {
      $log.debug('Modal accepted at: ' + new Date());
      
      // Create the stack inside our project first
      return NdsLabsApi.postProjectsByProjectIdStacks({ 'stack': newEntities.stack, 'projectId': projectId }).then(function(stack, xhr) {
        $log.debug("successfully posted to /projects/" + projectId + "/stacks!");
        
        // Add the new stack to the UI
        Stacks.all.push(stack);
        
        // Then attach our necessary volumes
        attachOrCreateVolumes(stack, newEntities.volumes).then(function() {
          Volumes.populate(projectId);
        });
      }, function(headers) {
        $log.error("error posting to /projects/" + projectId + "/stacks!");
      });
    });
  };
  
  var attachOrCreateVolumes = function(stack, volumes) {
    var promises = [];
    angular.forEach(volumes, function(volume) {
      var service = _.find(stack.services, ['service', volume.service]);
      if (!volume.id) {
        promises.push(createVolume(volume, service));
      } else {
        promises.push(attachVolume(volume.id, service));
      }
    });
    return $q.all(promises);
  };
  
  var attachVolume = function(volumeId, service) {
    // Look up this volume by id
    var volume = _.find(Volumes.all, [ 'id', volumeId ]);
    
    // We need to PUT to update existing volume
    volume.attached = service.id;
    
    // Attach existing volume to new service
    return NdsLabsApi.putProjectsByProjectIdVolumesByVolumeId({ 
      'volume': volume,
      'volumeId': volumeId,
      'projectId': projectId
    }).then(function(data, xhr) {
      $log.debug("successfully updated /projects/" + projectId + "/volumes/" + volume.id + "!");
      //_.merge(exists, data);
      volume = data;
    }, function(headers) {
      $log.error("error updating /projects/" + projectId + "/volumes/" + volume.id + "!");
    });
  };
  
  var createVolume = function(volume, service) {
    // Volume does not exist, so we need to POST to create it
    volume.attached = service.id;
    return NdsLabsApi.postProjectsByProjectIdVolumes({
      'volume': volume, 
      'projectId': projectId
    }).then(function(data, xhr) {
      $log.debug("successfully posted to /projects/" + projectId + "/volumes!");
      Volumes.all.push(data);
    }, function(headers) {
      $log.error("error posting to /projects/" + projectId + "/volumes!");
    });
  };
  
  /**
   * Display a modal window showing running log data for the given service
   * @param {} service - the service to show logs for
   */ 
  $scope.showLogs = function(service) {
    // See 'app/expert/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: 'app/expert/logViewer/logViewer.html',
      controller: 'LogViewerCtrl',
      windowClass: 'log-modal-window',
      size: 'lg',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: {
        service: function() { return service; },
        projectId: function() { return projectId; }
      }
    });
  };
  
  /**
   * Display a modal window showing running log data for the given service
   * @param {} service - the service to show logs for
   */ 
  $scope.showConfig = function(service) {
    // See 'app/expert/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: 'app/expert/configViewer/configViewer.html',
      controller: 'ConfigViewerCtrl',
      size: 'md',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: {
        service: function() { return service; }
      }
    });
  };
  
  /**
   * Deletes a stack from etcd, if successful it is removed from the UI.
   * @param {Object} stack - the stack to delete
   * 
   * TODO: If user specifies, also loop through and delete volumes?
   */
  $scope.deleteStack = function(stack) {
    // See 'app/expert/stackDelete/stackDelete.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/expert/stackDelete/stackDelete.html',
      controller: 'StackDeleteCtrl',
      size: 'md',
      keyboard: false,
      backdrop: 'static',
      resolve: {
        stack: function() { return stack; },
      }
    });

    // Define what we should do when the modal is closed
    modalInstance.result.then(function(removeVolumes) {
      $log.debug('Delete Stack Confirmation Modal dismissed at: ' + new Date());
      
      // Delete the stack and orphan the volumes
      NdsLabsApi.deleteProjectsByProjectIdStacksByStackId({
        'projectId': projectId,
        'stackId': stack.id
      }).then(function(data, xhr) {
        $log.debug('successfully deleted stack: ' + stack.name);
        
        $scope.configuredStacks.splice($scope.configuredStacks.indexOf(stack), 1);
        
        var toRemove = [];
        angular.forEach(stack.services, function(service) {
          angular.forEach($scope.configuredVolumes, function(volume) {
            if (volume.attached === service.id) {
              if (removeVolumes) {
                $scope.deleteVolume(volume, true);
              } else {
                volume.attached = "";
              }
            }
          });
        });
      }, function(headers) {
        $log.error('failed to delete stack: ' + stack.name);
      }, function() {
        Volumes.populate(projectId);
      });
    });
  };
  
  /** 
   * Deletes a volume from etcd, if successful it is removed from the UI
   * @param {Object} volume - the volume to delete
   * @param {boolean} [skipConfirm = false] - If true, do not show a 
   *    "Delete Volume" confirmation modal for this operation
   * 
   */
  $scope.deleteVolume = function(volume, skipConfirm) {
    var performDelete = function() {
      NdsLabsApi.deleteProjectsByProjectIdVolumesByVolumeId({
          'projectId': projectId,
          'volumeId': volume.id
        }).then(function(data, xhr) {
          $log.debug('successfully deleted volume: ' + volume.name);
          $scope.configuredVolumes.splice($scope.configuredVolumes.indexOf(volume), 1);
        }, function(headers) {
          $log.error('failed to delete volume: ' + volume.id);
        });
    };
    
    if (skipConfirm) {
      performDelete();
    } else {
      // See 'app/expert/volumeDelete/volumeDelete.html'
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/expert/volumeDelete/volumeDelete.html',
        controller: 'VolumeDeleteCtrl',
        size: 'md',
        keyboard: false,
        backdrop: 'static',
        resolve: {
          volume: function() { return volume; },
        }
      });
      
      // Define what we should do when the modal is closed
      modalInstance.result.then(function(volume) {
        $log.debug('User has chosen to delete volume: ' + volume.id);
        
        performDelete();
      });
    } 
  };
}]);
