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
.controller('ExpertSetupController', [ '$scope', '$log', '$interval', '$uibModal', '_', 'AuthInfo', 'Project', 'Volumes', 'Stacks', 'Specs', 'AutoRefresh', 'SoftRefresh',
    'StackService', 'NdsLabsApi', function($scope, $log, $interval, $uibModal, _, AuthInfo, Project, Volumes, Stacks, Specs, AutoRefresh, SoftRefresh, 
    StackService, NdsLabsApi) {
  
  // Grab our projectId from the login page
  var projectId = AuthInfo.get().namespace;
  
  /**
   * Populate all shared data from the server into our scope
   */
  Specs.populate().then(function() { 
    $scope.allServices = Specs.all;
    
    // After specs load, grab the other data
    Project.populate(projectId).then(function() { $scope.project = Project.project; });
    Stacks.populate(projectId).then(function() { $scope.configuredStacks = Stacks.all; });
    Volumes.populate(projectId).then(function() { $scope.configuredVolumes = Volumes.all; });
  });
  
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
    
    if (!transient) {
      AutoRefresh.stop();
    } else {
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
    // See '/app/expert/modals/stackStop/stackStop.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/app/expert/modals/stackStop/stackStop.html',
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
      AutoRefresh.stop();
      
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
    // Add this service to our stack locally
    var spec = _.find(Specs.all, [ 'key', svc.key ]);
    
    // Ensure that adding this service does not require new dependencies
    angular.forEach(spec.depends, function(dependency) {
      var svc = _.find(Specs.all, function(svc) { return svc.key === dependency.key });
      var stackSvc = new StackService(stack, svc);
      
      // Check if this required dependency is already present on our proposed stack
      var exists = _.find(stack.services, function(svc) { return svc.service === dependency.key });
      if (!exists) {
        // Add the service if it has not already been added
        stack.services.push(stackSvc);
      } else {
        // Skip this service if we see it in the list already
        $log.debug("Skipping duplicate service: " + svc.key);
      }
    });
    
    // Now that we have all required dependencies, add our target service
    stack.services.push(new StackService(stack, spec));
    
    // TODO: Should client or server handle this? My gut says server...
    //stack.updatedTime = new Date();
    
    // Then update the entire stack in etcd
    NdsLabsApi.putProjectsByProjectIdStacksByStackId({
      'stack': stack,
      'projectId': projectId,
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully added service ' + svc.key + ' to stack ' + stack.name);
    }, function(headers) {
      $log.error('failed to add service ' + svc.key + ' to stack ' + stack.name);
      
      // Restore our state from etcd
      Stacks.populate();
    });
  };
  
  /** 
   * Remove a service from a stopped stack 
   * @param {Object} stack - the stack to remove the service from
   * @param {Object} service - the service to remove
   */
  $scope.removeStackSvc = function(stack, svc) {
    // Remove this services locally
    stack.services.splice(stack.services.indexOf(svc), 1);
    //stack.updatedTime = new Date();
    
    // Then update the entire stack in etcd
    NdsLabsApi.putProjectsByProjectIdStacksByStackId({
      'stack': stack,
      'projectId': projectId,
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully removed service' + svc.key + '  from stack ' + stack.name);
    }, function(headers) {
      $log.error('failed to remove service ' + svc.key + ' from stack ' + stack.name);
      
      // Restore our state from etcd
      Stacks.populate();
    });
  };
  
  /**
   * Opens the Configuration Wizard to configure and add a new stack
   * @param {Object} spec - the spec to use to create a new stack
   */ 
  $scope.openWizard = function(spec) {
    // See '/app/expert/modals/configWizard/configurationWizard.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/app/expert/modals/configWizard/configurationWizard.html',
      controller: 'ConfigurationWizardCtrl',
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      resolve: {
        template: function() { return spec; },
        stacks: function() { return $scope.stacks; },
        deps: function() { return $scope.deps; },
        configuredVolumes: function() { return $scope.configuredVolumes; },
        configuredStacks: function() { return $scope.configuredStacks; }
      }
    });

    // Define what we should do when the modal is closed
    modalInstance.result.then(function(newEntities) {
      $log.debug('Modal accepted at: ' + new Date());
      
      // Create the stack inside our project first
      NdsLabsApi.postProjectsByProjectIdStacks({ 'stack': newEntities.stack, 'projectId': projectId }).then(function(stack, xhr) {
        $log.debug("successfully posted to /projects/" + projectId + "/stacks!");
        
        // Add the new stack to the UI
        Stacks.all.push(stack);
        
          // Then attach our necessary volumes
        if (stack.id) {
          angular.forEach(newEntities.volumes, function(volume) {
            var service = _.find(stack.services, ['service', volume.service]);
            
            if (!volume.id) {
              $scope.createVolume(volume, service);
            } else {
              var orphanVolume = _.find(Volumes.all, function(vol) { return vol.id === volume.id; });
              
              // Attach existing volume to new service
              $scope.attachVolume(orphanVolume, service);
            }
          });
        }
      }, function(headers) {
        $log.error("error posting to /projects/" + projectId + "/stacks!");
      });
    });
  };
  
  $scope.attachVolume = function(volume, service) {
    // We need to PUT to update existing volume
    volume.attached = service.id;
    
    // Attach existing volume to new service
    return NdsLabsApi.putProjectsByProjectIdVolumesByVolumeId({ 
      'volume': volume,
      'volumeId': volume.id,
      'projectId': projectId
    }).then(function(data, xhr) {
      $log.debug("successfully updated /projects/" + projectId + "/volumes/" + volume.id + "!");
      //_.merge(exists, data);
      volume = data;
    }, function(headers) {
      $log.error("error updating /projects/" + projectId + "/volumes/" + volume.id + "!");
    });
  };
  
  $scope.createVolume = function(volume, service) {
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
    }).finally(function() {
      //$scope.softRefresh();
    });
  };
  
  /**
   * Display a modal window showing running log data for the given service
   * @param {} service - the service to show logs for
   */ 
  $scope.showLogs = function(service) {
    // See '/app/expert/modals/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: '/app/expert/modals/logViewer/logViewer.html',
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
    // See '/app/expert/modals/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: '/app/expert/modals/configViewer/configViewer.html',
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
    // See '/app/expert/modals/stackDelete/stackDelete.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/app/expert/modals/stackDelete/stackDelete.html',
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
      // See '/app/expert/modals/volumeDelete/volumeDelete.html'
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/app/expert/modals/volumeDelete/volumeDelete.html',
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
