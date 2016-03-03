angular
.module('ndslabs')
.factory('Project', [function() {
  // An empty place-holder for our project data
  return {};
}])
.factory('Specs', [ '$log', '$q', '$http', 'MOCKDATA', 'NdsLabsApi', function($log, $q, $http, MOCKDATA, NdsLabsApi) {
  var promise = $q.defer();
      
  // An empty place-holder for our service/stack specs
  var specs = {
    all: [],
    stacks: [],
    deps: []
  };
  
  // specs.populate();
  
  return specs;
}])
.factory('Volumes', [function() {
  // An empty place-holder for our volumes
  return {
    all: [],
    attached: [],
    orphans: []
  };
}])
.factory('Stacks', [function() {
  // An empty place-holder for our deployed stacks
  return {
    all: [],
    configured: [],
    deployed: []
  };
}])
.service('Stack', [ 'Stacks', function(Stacks) {
    // TODO: This should be a service
  return function(template) {
    var stack = {
      id: "",
      name: "",
      key: template.key,
      status: "Suspended",
      services: []
    };
    
    //Stacks.all.push(stack);
    
    return stack;
  };
}])
.service('Volume', [ 'Volumes', function(Volumes) {
    // TODO: This should be a service
  return function(stack, service) { 
    var volume = {
      id: '',
      key: service.key,
      stack: stack.name,
      service: service.key,
      format: 'Raw',
      size: 10,
      sizeUnit: 'GB',
      attached: service.id
    };
    
    //Volumes.all.push(volume);
    
    return volume;
  };
}])
.service('StackService', [ function() {
    // TODO: This should be a service
  return function(stack, spec) {
    var svc = {
      id: "",
      stack: stack.key,
      service: spec.key,
      status: "",
      replicas: 1,
      endpoints: []
    };
    
    //stack.services.push(svc);
    
    return svc;
  };
}])
.filter('isRecursivelyRequired', [ 'Specs', function(Specs) {
  return function(services, service) {
    var result = false;
    angular.forEach(services, function(svc) {
      var spec = _.find(Specs.all, { 'key': svc.service });
      if (spec) {
        var dep = _.find(spec.depends, _.matchesProperty('key', service.service));
        if (dep && dep.required === true) {
          result = true;
        }
      }
    });
    return result;
  };
}])
.filter('missingDeps', [ '$log', 'Specs', function($log, Specs) {
  // Returns any options missing from a stack
  return function(stack) {
    if (!Specs.all || !Specs.all.length) {
      return [];
    }
    
    var spec = _.find(Specs.all, ['key', stack.key]);
    if (spec) {
      var options = _.filter(angular.copy(spec.depends), [ 'required', false ]);
      var missing = [];
      angular.forEach(options, function(op) {
        if (!_.find(stack.services, [ 'service', op.key ])) {
          missing.push(op);
        }
      });
      return missing;
    } else {
      $log.error("Cannot locate missing optional dependencies - key not found: " + stack.key);
    }
    return false;
  };
}])
.filter('options', [ '$log', 'Specs', function($log, Specs) {
  // Returns a list of options for a spec
  return function(key) {
    if (!Specs.all || !Specs.all.length) {
      return [];
    }
    
    var spec = _.find(Specs.all, ['key', key]);
    if (spec) {
      var options = _.filter(spec.depends, [ 'required', false ]);
      return options;
    } else {
      $log.error("Cannot locate options - key not found: " + key);
    }
    return [];
  };
}])
.filter('requirements', [ '$log', 'Specs', function($log, Specs) {
  // Return a list of requirements for a spec
  return function(key) {
    if (!Specs.all || !Specs.all.length) {
      return [];
    }
    
    var spec = _.find(Specs.all, ['key', key]);
    if (spec) {
      var requirements = _.filter(spec.depends, [ 'required', true ]);
      return requirements;
    } else {
      $log.error("Cannot locate requirements - key not found: " + key);
    }
    return [];
  };
}])
.filter('orphansExist', function() {
  return function(orphans, service) {
    var matches = [];
    angular.forEach(orphans, function(orphan) {
      if (orphan.service === service) {
        matches.push(orphan);
      }
    });
    return matches;
  };
})
.controller('ConfigurationWizardCtrl', [ '$scope', '$log', '$uibModalInstance', 'Stack', 'Volume', 'StackService', 'Grid', 'Wizard', 'WizardPage', 'template', 'stacks', 'deps', 'configuredStacks', 'configuredVolumes',
    function($scope, $log, $uibModalInstance, Stack, Volume, StackService, Grid, Wizard, WizardPage, template, stacks, deps, configuredStacks, configuredVolumes) {

  
  $scope.discoverVolumeReqs = function(stack) {
    var reusableVolumes = [];
    var requiredVolumes = [];
    angular.forEach(stack.services, function(requestedSvc) {
      var svcSpec = _.find(_.concat(stacks, deps), function(svc) { return svc.key === requestedSvc.service });
      if (svcSpec.requiresVolume === true) {
        angular.forEach(configuredVolumes, function(volume) {
          if (!volume.attachment && svcSpec.key === volume.service) {
            // This is an orphaned volume from this service... Prompt the user to reuse it
            reusableVolumes.push(volume);
          }
        });
        requiredVolumes.push(new Volume(stack, svcSpec));
      }
    });

    $scope.newStackOrphanedVolumes = reusableVolumes;
    $scope.newStackVolumeRequirements = requiredVolumes;
  };

  // TODO: Use queue for recursion?
  $scope.collectDependencies = function(targetSvc) {
    angular.forEach(targetSvc.depends, function(dependency) {
      var key = dependency.key;
      var required = dependency.required;
      var svc = _.find(deps, function(svc) { return svc.key === key });
      var stackSvc = new StackService($scope.newStack, svc);
      var targetArray = null;
      if (required) {
          targetArray = $scope.newStack.services;
      } else {
          targetArray = $scope.newStackOptions;
      }

      // Check if this service is already present on our proposed stack
      var exists = _.find($scope.newStack.services, function(svc) { return svc.service === key });
      if (!exists) {
        // Add the service if it has not already been added
        targetArray.push(stackSvc);
      } else {
        // Skip this service if we see it in the list already
        $log.debug("Skipping duplicate service: " + svc.key);
      }
    });
  };
  
  $scope.listRequiredDeps = function(svc) {
    var spec = _.find(deps, function(service) { return service.key === svc.service });
    var required = [];
    angular.forEach(spec.depends, function(dep) {
      if (dep.required === true) {
        required.push(dep.key);
      }
    });
    return required;
  };

  
  // The delay (in seconds) before allowing the user to click "Next"
  var initDelay = 0;

  // Define a big pile of logic for our wizard pages
  var configPages = [
     new WizardPage("intro", "Introduction", {
        prev: null,
        canPrev: false,
        canNext: function() {
          return $scope.newStack && $scope.newStack.name !== '' && !_.find(configuredStacks, function(stack) { return stack.name === $scope.newStack.name; });
        },
        next: 'config',
        onNext: function() {
          $log.debug("Verifying that the name " + $scope.newStack.name + " has not already been used by another service...");
          $log.debug("Gathering optional dependencies and their requirements...");
          $scope.newStackOptionalDeps = {};
          angular.forEach($scope.newStackOptions, function(opt) {
            $scope.newStackOptionalDeps[opt.service] = $scope.listRequiredDeps(opt);
          });
        }
     }, false),
     new WizardPage("config", "Configuration", {
        prev: 'intro',
        canPrev: true,
        canNext: true,
        next: 'volumes',
        onNext: function() {
          $log.debug("Adding optional selections to stack...");
          $scope.newStack.services = angular.copy($scope.newStackRequirements);
          angular.forEach($scope.optionalLinksGrid.selector.selection, function(option) {
            var svc = _.find(deps, function(svc) { return svc.key === option.service });
            $scope.collectDependencies(svc);
            $scope.newStack.services.push(new StackService($scope.newStack, svc));
          });

          $log.debug("Discovering volume requirements...");
          $scope.discoverVolumeReqs($scope.newStack); 
        }
     }, true),
     new WizardPage("volumes", "Volumes", {
        prev: 'config',
        canPrev: true,
        canNext: function() {
          var requiredParams = ['name', 'size', 'sizeUnit'];
          var volumeParamsSet = true;
          angular.forEach($scope.newStackVolumeRequirements, function(volume) {
            angular.forEach(requiredParams, function (key) {
              if (!volume[key] || volume[key] === '') {
                volumeParamsSet = false;
                return;
              }
            });
          });
          return volumeParamsSet;
        },
        next: 'confirm',
        onNext: function() {
          $log.debug("Verifying that user has made valid 'Volume' selections...");
        }
     }, true),
     new WizardPage("confirm", "Confirmation", {
        prev: 'volumes',
        canPrev: true,
        canNext: false,
        next: null
     }, true)
  ];
  
  // Create a new Wizard to display
  $scope.wizard = new Wizard(configPages, initDelay);
  
  $scope.newStack = new Stack(template);
  $scope.newStackLabel = template.label;
  $scope.newStackOptions = [];
  var pageSize = 100;
  $scope.optionalLinksGrid = new Grid(pageSize, function() { return $scope.newStackOptions; });

  // Add our base service to the stack
  var base = _.find(_.concat(deps, stacks), function(svc) { return svc.key === template.key });
  $scope.newStack.services.push(new StackService($scope.newStack, base));

  // Add required dependencies to the stack
  $scope.collectDependencies(template);

  $scope.newStackRequirements = angular.copy($scope.newStack.services);
  
  $scope.ok = function () {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close({ 'stack': $scope.newStack, 'volumes': $scope.newStackVolumeRequirements });
  };

  $scope.close = function () {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}])
.controller('ExpertSetupController', [ '$scope', '$log', '$uibModal', '_', 'AuthInfo', 'Project', 'Volumes', 'Stacks', 'Specs', 
    'DEBUG', 'StackService', 'NdsLabsApi', function($scope, $log, $uibModal, _, AuthInfo, Project, Volumes, Stacks, Specs, DEBUG, 
    StackService, NdsLabsApi) {

  $scope.app = _.sample([ 
    { name: 'StackMaster',      tagline: 'Become one with the stack' }, 
    { name: 'StackBlaster',     tagline: 'Stack the odds in your favor' },
    { name: 'MasterBlaster',    tagline: 'Find your inner stack' },
    { name: 'NOOBernetes',      tagline: 'For teh noobs!' },
    { name: "DrStack",          tagline: 'One stack, two stack, red stack, blue stack?' },
    { name: "Stackster",        tagline: 'It\'s where the stacks go' }
  ]);
  
  // Wire in DEBUG mode
  $scope.DEBUG = DEBUG;

  // Accounting stuff
  $scope.counts = {};
  $scope.svcQuery = '';
  $scope.nextId = 1;
  
  $scope.currentProject = {};
  $scope.configuredStacks = [];
  $scope.configuredVolumes = [];
  
  var projectId = AuthInfo.get().namespace;
  
  var query = {};
  
  // Grab the current project
  (query.project = function() {
    return NdsLabsApi.getProjectsByProjectId({ "projectId": projectId }).then(function(project, xhr) {
      $log.debug("successfully grabbed from /projects/" + projectId + "!");
      $scope.project = AuthInfo.project = Project = project;
    }, function(headers) {
      $log.debug("error!");
      console.debug(headers);
    })
  })();
  
  // Grab the list of services available at our site
  (query.services = function() {
    return NdsLabsApi.getServices().then(function(specs, xhr) {
      $log.debug("successfully grabbed from /services!");
      Specs.all = $scope.allServices = specs;
      Specs.deps = $scope.deps = angular.copy(specs);
      Specs.stacks = $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true; });
    }, function (headers) {
      $log.error("error grabbing from /services!");
    })
  })();
  
  (query.stacks = function() {
    // Grab the list of configured stacks in our namespace
    return NdsLabsApi.getProjectsByProjectIdStacks({ "projectId": projectId }).then(function(stacks, xhr) {
      $log.debug("successfully grabbed from /projects/" + projectId + "/stacks!");
      //Stacks.all = stacks || [];
      $scope.configuredStacks = stacks || [];
    }, function(headers) {
      $log.error("error grabbing from /projects/" + projectId + "/stacks!");
    });
  })();
  
  // Grab the list of volumes in our namespace
  (query.volumes = function() {
    return NdsLabsApi.getProjectsByProjectIdVolumes({ "projectId": projectId }).then(function(volumes, xhr) {
      $log.debug("successfully grabbed from /projects/" + projectId + "/volumes!");
      //Volumes.all = volumes || [];
      $scope.configuredVolumes = volumes || [];
    }, function(headers) {
      $log.error("error grabbing from /projects/" + projectId + "/volumes!");
    })
  })();
  
  // TODO: This could be a service
  $scope.openWizard = function(template) {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/app/expert/subviews/wizardModal.html',
      controller: 'ConfigurationWizardCtrl',
      size: 'lg',
      resolve: {
        template: function() { return template; },
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
        //$scope.configuredStacks.push($scope.newStack);
        debugger;
    
        $scope.configuredStacks.push(stack);
        
        // Then attach our necessary volumes
        angular.forEach(newEntities.volumes, function(vol) {
          var service = _.find(stack.services, ['service', vol.service]);
          
          debugger;
          if (service) {
            vol.attached = service.id;
            NdsLabsApi.postProjectsByProjectIdVolumes({ 'volume': vol, 'projectId': projectId }).then(function(response, xhr) {
              $log.debug("successfully posted to /projects/" + projectId + "/volumes!");
              
              $scope.configuredVolumes.push(vol);
                
              // Orphaned volumes are already in the list
                /* var exists = _.find($scope.configuredVolumes, function(volume) { return vol.name === volume.name; });
              if (!exists) {
                $scope.configuredVolumes.push(vol);
              } else {
                exists.stack = $scope.newStack.name;
                exists.attachment = $scope.stack + '-' + exists.service;
              }*/
            }, function(headers) {
              $log.error("error posting to /projects/" + projectId + "/volumes!");
            });
          }
        });
      }, function(headers) {
        $log.error("error posting to /projects/" + projectId + "/stacks!");
      });
    }, function() {
      $log.debug('Modal dismissed at: ' + new Date());
    });
  };
  
  $scope.startStack = function(stack) {
    stack.status = 'starting';
    NdsLabsApi.getProjectsByProjectIdStartByStackId({
      'projectId': projectId,
      'stackId': stack.key
    }).then(function(data, xhr) {
      $log.debug('successfully started ' + stack.name);
      
      // TODO: This is sort of hacky
      stack.status = data.status;
      stack.services = data.services;
    }, function(headers) {
      $log.error('failed to start ' + stack.name);
    });
  };
  
  $scope.stopStack = function(stack) {
    stack.status = 'stopping';
    NdsLabsApi.getProjectsByProjectIdStopByStackId({
      'projectId': projectId,
      'stackId': stack.key
    }).then(function(data, xhr) {
      $log.debug('successfully stopped ' + stack.name);
      
      // TODO: this is really hacky
      stack.status = 'stopped';
      angular.forEach(stack.services, function(svc) {
        svc.status = "";
        svc.endpoints = [];
      });
    }, function(headers) {
      $log.error('failed to stop ' + stack.name);
    });
  };
  
  $scope.showLogs = function(service) {
    NdsLabsApi.getProjectsByProjectIdLogsByStackServiceId({ 
      'projectId': projectId,
      'stackServiceId': service.id
    }).then(function(data, xhr) {
      $log.debug('successfully grabbed logs for serviceId ' + service.id);
      //$scope.serviceLogs = data;
      alert(data);
    }, function(headers) {
      //$scope.serviceLogs = 'An error was encountered querying this service\'s logs.';
    });
  };
  
  $scope.showVolume = function(stack, svc) {
    var volume = null;
    angular.forEach($scope.configuredVolumes, function(vol) {
      if (svc.id === vol.attached) {
        volume = vol;
      }
    });

    return volume;
  };

  $scope.toggleStatus = function(stack, state) {
    if (angular.isUndefined(state)) {
      state = !stack.status;
    }
    stack.status = state;
    angular.forEach(stack.services, function(svc) {
      svc.status = state;
    });
  };
  
  /*$scope.confirmRemoval = function(stack) {
    $scope.deletionCandidate = stack;
    $('#confirmModal').modal('show');
  };*/

  $scope.removeCandidateStack = function(stack, removeVolumes) {
    NdsLabsApi.deleteProjectsByProjectIdStacksByStackId({
      'projectId': projectId,
      'stackId': stack.key
    }).then(function(data, xhr) {
      $log.debug('successfully deleted stack: ' + stack.name);
      $scope.configuredStacks.splice($scope.configuredStacks.indexOf(stack), 1);
    }, function(headers) {
      
    });
    
    /*var toRemove = [];

    // Loop to find any associated volumes
    angular.forEach($scope.configuredVolumes, function(volume) {
      if (volume.stack === stack.name) {
        if (removeVolumes) {
          toRemove.push(volume);
        } else {
          volume.attachment = null;
        }
      }
    });
    
    // Then remove the stack itself
    $scope.configuredStacks.splice($scope.configuredStacks.indexOf(stack), 1);

    // Remove any volumes associated, if asked 
    if (removeVolumes) {
      angular.forEach(toRemove, function(volume) {
        $scope.configuredVolumes.splice($scope.configuredVolumes.indexOf(volume), 1);
      });
    }*/
  };
  
  $scope.addStackSvc = function(stack, svc) {
    var spec = _.find(Specs.all, [ 'key', svc.key ]);
    
    if (spec) {
      // Ensure this does not require new dependencies
      angular.forEach(spec.depends, function(dependency) {
        var svc = _.find(Specs.all, function(svc) { return svc.key === dependency.key });
        var stackSvc = new StackService(stack, svc);
        
        // Check if this service is already present on our proposed stack
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
    } else {
      $log.error("spec not found: " + svc.key);
    }
  };
  
  $scope.removeStackSvc = function(stack, svc) {
    var spec = _.find($scope.stacks, _.matchesProperty('key', stack.key));
    
    stack.services.splice(stack.services.indexOf(svc), 1);
    var volume = $scope.showVolume(stack, svc);
    if (volume) {
      angular.forEach($scope.configuredVolumes, function(volume) {
        if (volume.stack === stack.name) {
          volume.attachment = null;
        }
      });
    }
  };
}]);
