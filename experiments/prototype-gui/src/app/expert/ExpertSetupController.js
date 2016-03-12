/**
 * The main view of our app, this controller houses the
 * "Deploy" and "Manage" portions of the interface
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
angular.module('ndslabs')
.controller('ExpertSetupController', [ '$scope', '$log', '$interval', '$uibModal', '_', 'AuthInfo', 'Project', 'Volumes', 'Stacks', 'Specs', 
    'DEBUG', 'StackService', 'NdsLabsApi', function($scope, $log, $interval, $uibModal, _, AuthInfo, Project, Volumes, Stacks, Specs, DEBUG, 
    StackService, NdsLabsApi) {
      
  /**
   * Allow the user to dismiss the "welcome banner"
   */ 
  $scope.showWelcomeMessage = true;
  $scope.hideWelcomeMessage = function() {
    $scope.showWelcomeMessage = false;
  };
  
  /**
   * Allow the user to show / hide the volumes slide-out panel
   */ 
  $scope.showVolumePane = false;
  
  $scope.selectVolume = function(volume) {
    $scope.selectedVolume=volume.id;
    $scope.selectedTab = 1;
  };
  
  /**
   * The name / tagline of our app
   * TODO: This will need to be moved to a constant when we add more pages
   */ 
  $scope.app = _.sample([ 
    { name: 'StackMagic',      tagline: 'Add and manage software stacks' }, 
    /*{ name: 'StackBlaster',     tagline: 'Stack the odds in your favor' },
    { name: 'MasterBlaster',    tagline: 'Find your inner stack' },
    { name: 'NOOBernetes',      tagline: 'For teh noobs!' },
    { name: "DrStack",          tagline: 'One stack, two stack, red stack, blue stack?' },
    { name: "Stackstr",        tagline: 'It\'s where the stacks go' }*/
  ]);
  
  // Wire in DEBUG mode
  $scope.DEBUG = DEBUG;

  // Accounting stuff
  $scope.counts = {};
  $scope.svcQuery = '';
  $scope.nextId = 1;
  
  // Storage structures
  $scope.currentProject = {};
  $scope.configuredStacks = Stacks.all;
  $scope.configuredVolumes = Volumes.all;
  
  // Helpful stuff
  var projectId = AuthInfo.get().namespace;
  var query = {};
  
  /**
   * Perform a "soft-refresh". That is, refresh the data without fully re-rendering the page
   */ 
  ($scope.softRefresh = function() {
    
    /**
     * Grabs metadata about the current project
     */ 
    (query.project = function() {
      // Grab the metadata associated with our current namespace
      return NdsLabsApi.getProjectsByProjectId({ 
        "projectId": projectId 
      }).then(function(project, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "!");
        $scope.project = AuthInfo.project = Project = project;
      }, function(headers) {
        $log.debug("error!");
        console.debug(headers);
      })
    })();
    
    /**
     * Grabs metadata about the current site's available services
     */ 
    (query.services = function() {
      // Grab the list of available services at our site
      return NdsLabsApi.getServices().then(function(specs, xhr) {
        $log.debug("successfully grabbed from /services!");
        Specs.all = $scope.allServices = specs;
        Specs.deps = $scope.deps = angular.copy(specs);
        Specs.stacks = $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true; });
      }, function (headers) {
        $log.error("error grabbing from /services!");
      })
    })();
    
    /**
     * Grabs metadata about the current project's stacks
     */ 
    (query.stacks = function() {
      // Grab the list of configured stacks in our namespace
      return NdsLabsApi.getProjectsByProjectIdStacks({ 
        "projectId": projectId 
      }).then(function(stacks, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "/stacks!");
        //Stacks.all = stacks || [];
        
        if ($scope.configuredStacks === [] && stacks !== []) {
          // Catch edge case here?
        }
        
        $scope.configuredStacks = Stacks.all = stacks || [];
      }, function(headers) {
        $log.error("error grabbing from /projects/" + projectId + "/stacks!");
      });
    })();
    
    /**
     * Grabs metadata about the current project's volumes
     */ 
    (query.volumes = function() {
      // Grab the list of configured volumes in our namespace
      return NdsLabsApi.getProjectsByProjectIdVolumes({ 
        "projectId": projectId
      }).then(function(volumes, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "/volumes!");
        //Volumes.all = volumes || [];
        Volumes.all = $scope.configuredVolumes = volumes || [];
      }, function(headers) {
        $log.error("error grabbing from /projects/" + projectId + "/volumes!");
      })
    })();
  })();
  
  /**
   * A map-like structure to store our intervals, keyed by stack UUID
   */
  $scope.intervals = {
    'start': {},
    'stop': {}
  };
  
  /**
   * Starts the given stack's services one-by-one and does a "soft-refresh" when complete
   * @param {Object} stack - the stack to launch
   */ 
  $scope.startStack = function(stack) {
      // Signal to the UI that we are starting this stack
    $scope.intervals.start[stack.id] = $interval($scope.softRefresh, 2000);
    
      // Then send the "start" command to the API server
    NdsLabsApi.getProjectsByProjectIdStartByStackId({
      'projectId': projectId,
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully started ' + stack.name);
    }, function(headers) {
      $log.error('failed to start ' + stack.name);
    }).finally(function() {
      $scope.softRefresh();
      $interval.cancel($scope.intervals.start[stack.id]);
      $scope.intervals.start[stack.id]  = null;
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
      // Signal to the UI that we are stopping this stack
      $scope.intervals.stop[stack.id] = $interval($scope.softRefresh, 2000);
      
      // Then send the "stop" command to the API server
      NdsLabsApi.getProjectsByProjectIdStopByStackId({
        'projectId': projectId,
        'stackId': stack.id
      }).then(function(data, xhr) {
        $log.debug('successfully stopped ' + stack.name);
      }, function(headers) {
        $log.error('failed to stop ' + stack.name);
      }).finally(function() {
        $scope.softRefresh();
        $interval.cancel($scope.intervals.stop[stack.id]);
        $scope.intervals.stop[stack.id] = null;
      });
    });
  };
  
  /** 
   * Checks if a volume exists for the given stack and service and return it if it exists
   * @param {Object} svc - the service to check against the list of volumes
   */
  $scope.showVolume = function(svc) {
    var volume = null;
    angular.forEach($scope.configuredVolumes, function(vol) {
      if (svc.id === vol.attached) {
        volume = vol;
      }
    });

    return volume;
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
      query.stacks();
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
      query.stacks();
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
        $scope.configuredStacks.push(stack);
        
        // Then attach our necessary volumes
        angular.forEach(newEntities.volumes, function(vol) {
          var service = _.find(stack.services, ['service', vol.service]);
          
          if (service) {
            if (!vol.id) {
              // Volume does not exist, so we need to create a new entry
              vol.attached = service.id;
              NdsLabsApi.postProjectsByProjectIdVolumes({
                'volume': vol, 
                'projectId': projectId
              }).then(function(data, xhr) {
                $log.debug("successfully posted to /projects/" + projectId + "/volumes!");
                Volumes.all.push(data);
              }, function(headers) {
                $log.error("error posting to /projects/" + projectId + "/volumes!");
              });
            } else {
              // Orphaned volumes are already in the list
              var exists = _.find($scope.configuredVolumes, function(volume) { return vol.id === volume.id; });
              
              // We need to update existing volume
              exists.attached = service.id;
              
              // Attach existing volume to new service
              NdsLabsApi.putProjectsByProjectIdVolumesByVolumeId({ 
                'volume': exists,
                'volumeId': exists.name,
                'projectId': projectId
              }).then(function(data, xhr) {
                $log.debug("successfully updated /projects/" + projectId + "/volumes/" + exists.name + "!");
                exists = data;
              }, function(headers) {
                $log.error("error updating /projects/" + projectId + "/volumes/" + exists.name + "!");
              });
            }
          }
        });
      }, function(headers) {
        $log.error("error posting to /projects/" + projectId + "/stacks!");
      });
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
          'volumeId': volume.name
        }).then(function(data, xhr) {
          $log.debug('successfully deleted volume: ' + volume.name);
          $scope.configuredVolumes.splice($scope.configuredVolumes.indexOf(volume), 1);
        }, function(headers) {
          $log.error('failed to delete volume: ' + volume.name);
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
        $log.debug('User has chosen to delete volume: ' + volume.name);
        
        performDelete();
      });
    } 
  };
}]);
