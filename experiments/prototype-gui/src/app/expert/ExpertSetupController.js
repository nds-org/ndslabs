angular
.module('ndslabs')
.filter('isRecursivelyRequired', function() {
  return function(services, service, stacks, deps) {
    var result = false;
    angular.forEach(services, function(svc) {
      var spec = _.find(_.concat(stacks, deps), { 'key': svc.serviceId });
      if (spec) {
        var dep = _.find(spec.depends, _.matchesProperty('key', service.serviceId));
        if (dep && dep.required === true) {
          result = true;
        }
      }
    });
    return result;
  };
})
.filter('missingDeps', function() {
  // Returns true iff service list provided does not contain all of the specified dependencies
  return function(services, stacks, stackKey, reqOpt) {
    var svc = _.find(stacks, _.matchesProperty('key', stackKey));
    
    if (svc) {
      var inverted = _.invertBy(_.mapValues(_.keyBy(svc.depends, function(o) {
        return o.key;
      }), 'required'));
      
      // Given a list of dependency names, check for their existence in services
      var areDepsMissing = function(dependencySet) {
        var missingDeps = false;
        angular.forEach(dependencySet, function(service) {
          var exists = _.find(services, { 'serviceId': service });
          if (!exists) {
            missingDeps = true
          }
        });
        return missingDeps;
      };
      
      // Get one set of dependencies, or a map of all of them
      if (reqOpt === 'required') {
        // Only diff against required deps
        return areDepsMissing(inverted['true']);
      } else if (reqOpt === 'optional') {
        // Only diff against optional deps
        return areDepsMissing(inverted['false']);
      } else {
        // Get both diffs, concat them, and return
        return areDepsMissing(_.concat(inverted['true'], inverted['false']));
      }
    } 
    return false;
  };
})
.filter('difference', function() {
  return function(colA, colB, predicate) {
    return _.differenceBy(colA, colB, predicate);
  };
})
.filter('contains', function() {
  return function(collection, label, key) {
    debugger;
    return _.find(collection, _.matchesProperty(label, key));
  }
})
.filter('dependencies', function() {
  return function(stacks, target, reqOpt) {
    var svc = _.find(stacks, _.matchesProperty('key', target));
    debugger;
    if (svc) {
      var inverted = _.invertBy(svc.dependencies);
      
      // Get one set of dependencies, or a map of all of them
      if (reqOpt === 'required') {
        return inverted['true']
      } else if (reqOpt === 'optional') {
        return inverted['false']
      } else {
        return _.mapKeys(inverted, { 'true':'required', 'false':'optional' });
      }
    } 
    return [];
  };
})
.filter('volumesExist', function() {
  return function(volumes, stackName, svcId) {
    var matches = [];
    angular.forEach(volumes, function(vol) {
      if (stackName === vol.stackId && svcId === vol.serviceId) {
        matches.push(vol);
      }
    });
    return matches;
  };
})
.filter('orphansExist', function() {
  return function(orphans, serviceId) {
    var matches = [];
    angular.forEach(orphans, function(orphan) {
      if (orphan.serviceId === serviceId) {
        matches.push(orphan);
      }
    });
    return matches;
  };
})
.controller('ConfigurationWizardCtrl', [ '$scope', '$log', '$uibModalInstance', 'Grid', 'Wizard', 'WizardPage', 'template', 'stacks', 'deps', 'configuredStacks', 'configuredVolumes',
    function($scope, $log, $uibModalInstance, Grid, Wizard, WizardPage, template, stacks, deps, configuredStacks, configuredVolumes) {
  // TODO: This should be a service
  var createStack = function(template) {
    return {
      id: "",
      name: "",
      key: template.key,
      status: "Suspended",
      services: []
    };
  };

  // TODO: This should be a service
  var createStackSvc = function(stack, svc) {
    return {
      id: "",
      stackId: stack.name,
      serviceId: svc.key,
      status: "Suspended",
      replicas: 1,
      endpoints: []
    };
  };

  // TODO: This should be a service
  var createVolume = $scope.createVolume = function(stackName, svcSpecKey) { 
    return {
      id: '',
      stackId: stackName,
      serviceId: svcSpecKey,
      format: 'Raw',
      size: 10,
      sizeUnit: 'GB',
      attachment: stackName + '-' + svcSpecKey
    };
  };
  
  $scope.discoverVolumeReqs = function(stack) {
    var reusableVolumes = [];
    var requiredVolumes = [];
    angular.forEach(stack.services, function(requestedSvc) {
      var svcSpec = _.find(_.concat(stacks, deps), function(svc) { return svc.key === requestedSvc.serviceId });
      if (svcSpec.requiresVolume === true) {
        angular.forEach(configuredVolumes, function(volume) {
          if (!volume.attachment && svcSpec.key === volume.serviceId) {
            // This is an orphaned volume from this service... Prompt the user to reuse it
            reusableVolumes.push(volume);
          }
        });
        requiredVolumes.push(createVolume(stack.name, svcSpec.key));
      }
    });

    $scope.newStackOrphanedVolumes = reusableVolumes;
    $scope.newStackVolumeRequirements = requiredVolumes;
  };

  $scope.finishWizard = function(newStack) {
    // Associate this stack with our user 
    configuredStacks.push(newStack);
    angular.forEach($scope.newStackVolumeRequirements, function(vol) {
      // Orphaned volumes are already in the list
      var exists = _.find(configuredVolumes, function(volume) { return vol.name === volume.name; });
      if (!exists) {
        configuredVolumes.push(vol);
      } else {
        exists.stackId = $scope.newStack.name;
        exists.attachment = $scope.stackId + '-' + exists.serviceId;
      }
    });
  };

  // TODO: Use queue for recursion?
  $scope.collectDependencies = function(targetSvc) {
    angular.forEach(targetSvc.depends, function(dependency) {
      var key = dependency.key;
      var required = dependency.required;
      var svc = _.find(deps, function(svc) { return svc.key === key });
      var stackSvc = createStackSvc($scope.newStack, svc);
      var targetArray = null;
      if (required) {
          targetArray = $scope.newStack.services;
      } else {
          targetArray = $scope.newStackOptions;
      }

      // Check if this service is already present on our proposed stack
      var exists = _.find($scope.newStack.services, function(svc) { return svc.serviceId === key });
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
    var spec = _.find(deps, function(service) { return service.key === svc.serviceId });
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
            $scope.newStackOptionalDeps[opt.serviceId] = $scope.listRequiredDeps(opt);
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
            var svc = _.find(deps, function(svc) { return svc.key === option.serviceId });
            $scope.collectDependencies(svc);
            $scope.newStack.services.push(createStackSvc($scope.newStack, svc));
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
  
  $scope.newStack = createStack(template);
  $scope.newStackLabel = template.label;
  $scope.newStackOptions = [];
  var pageSize = 100;
  $scope.optionalLinksGrid = new Grid(pageSize, function() { return $scope.newStackOptions; });

  // Add our base service to the stack
  var base = _.find(_.concat(deps, stacks), function(svc) { return svc.key === template.key });
  $scope.newStack.services.push(createStackSvc($scope.newStack, base));

  // Add required dependencies to the stack
  $scope.collectDependencies(template);

  $scope.newStackRequirements = angular.copy($scope.newStack.services);
  
  $scope.ok = function () {
    $log.debug("Closing modal with success!");
    $scope.finishWizard($scope.newStack);
    $uibModalInstance.close($scope.newStack);
  };

  $scope.close = function () {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}])
.controller('ExpertSetupController', [ '$scope', '$log', '$uibModal', '_', 'DEBUG', 'NdsLabsApi', 
    function($scope, $log, $uibModal, _, DEBUG, NdsLabsApi) {
  // TODO: This should be a service
  var createStackSvc = function(stack, svc) {
    return {
      id: "",
      stackId: stack.name,
      serviceId: svc.key,
      status: "Suspended",
      replicas: 1,
      endpoints: []
    };
  };
  
  // Wire in DEBUG mode
  $scope.DEBUG = DEBUG;

  // Accounting stuff
  $scope.counts = {};
  $scope.svcQuery = '';
  $scope.nextId = 1;
  $scope.currentProject = {
    id: '',
    namespace: 'default',
    name: 'Test Project',
    description: 'NDS Labs Test Project',
    quota: 3,
    quotaUnits: 'TB'
  };
  
  // Stacks test data
  $scope.configuredStacks = [
    {
      "id": "",
      "name": "clowder",
      "key": "clowder",
      "status": true,
      "services": [
        {
          "id": "",
          "stackId": "clowder",
          "serviceId": "clowder",
          "status": true,
          "replicas": 1,
          "endpoints": [ 
            "http://141.142.209.135/clowder"
          ]
        },
        {
          "id": "",
          "stackId": "clowder",
          "serviceId": "mongo",
          "status": true,
          "replicas": 1,
          "endpoints": []
        },
        {
          "id": "",
          "stackId": "clowder",
          "serviceId": "rabbitmq",
          "status": true,
          "replicas": 1,
          "endpoints": []
        },
        {
          "id": "",
          "stackId": "clowder",
          "serviceId": "image-preview",
          "status": true,
          "replicas": 1,
          "endpoints": []
        }
      ]
    }
  ];
  
  // Volume test data
  $scope.configuredVolumes = [
    {
      "id": "",
      "stackId": "clowder",
      "serviceId": "mongo",
      "format": "Raw",
      "size": 10,
      "sizeUnit": "GB",
      "name": "mongo",
      "attachment": "clowder-mongo",
      "useOrphan": false 
    }
  ];
  
  $scope.stacks = [];

  // TODO: Investigate options / caching
  
  // Grab our list of services
  NdsLabsApi.getServices().then(function(data, xhr) {
    $log.debug("success!");
    $scope.allServices = data;
    $scope.deps = angular.copy(data);
    $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true  });
  }, function (headers) {
    $log.debug("error!");
    console.debug(headers);
  });
  /*Services.query(function(data, xhr) {
    $log.debug("success!");
    $scope.allServices = data;
    $scope.deps = angular.copy(data);
    $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true  });
  }, function (headers) {
    $log.debug("error!");
    console.debug(headers);
  });*/
  
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
    modalInstance.result.then(function (selectedItem) {
      //$scope.selected = selectedItem;
      $log.debug('Modal accepted at: ' + new Date());
    }, function () {
      $log.debug('Modal dismissed at: ' + new Date());
    });
  };
  
  $scope.showVolume = function(stack, svc) {
    var volume = null;
    angular.forEach($scope.configuredVolumes, function(vol) {
      if (stack.name === vol.stackId && svc.serviceId === vol.serviceId) {
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
    var toRemove = [];

    // Loop to find any associated volumes
    angular.forEach($scope.configuredVolumes, function(volume) {
      if (volume.stackId === stack.name) {
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
    }
  };
  
  $scope.addStackSvc = function(stack, svcName) {
    var spec = _.find($scope.deps, { 'key': svcName });
    if (spec) {
      // Ensure this does not require new dependencies
      angular.forEach(spec.depends, function(dependency) {
        var svc = _.find($scope.deps, function(svc) { return svc.key === dependency.key });
        var stackSvc = createStackSvc(stack, svc);
        
        // Check if this service is already present on our proposed stack
        var exists = _.find(stack.services, function(svc) { return svc.serviceId === dependency.key });
        if (!exists) {
          // Add the service if it has not already been added
          stack.services.push(stackSvc);
        } else {
          // Skip this service if we see it in the list already
          $log.debug("Skipping duplicate service: " + svc.key);
        }
      });
      
      // Now that we have all required dependencies, add our target service
      stack.services.push(createStackSvc(stack, spec));
    } else {
      $log.error("spec not found: " + svcName);
    }
  };
  
  $scope.removeStackSvc = function(stack, svc) {
    var spec = _.find($scope.stacks, _.matchesProperty('key', stack.key));
    
    stack.services.splice(stack.services.indexOf(svc), 1);
    var volume = $scope.showVolume(stack, svc);
    if (volume) {
      angular.forEach($scope.configuredVolumes, function(volume) {
        if (volume.stackId === stack.name) {
          volume.attachment = null;
        }
      });
    }
  };
}]);
