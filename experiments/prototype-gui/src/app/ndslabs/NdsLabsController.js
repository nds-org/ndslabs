angular
.module('ndslabs')
.constant('EtcdHost', 'localhost')
.constant('EtcdPort', '4001')
// 'http://' + EtcdHost + ':' + EtcdPort + '/v2/keys/:category/:name'
.factory('Services', [ '$resource', 'EtcdHost', 'EtcdPort', function($resource, EtcdHost, EtcdPort) {
  return $resource('/app/services.json', {category: 'services', name:'@name'}, {
      get: {method:'GET', params:{}},
      put: {method:'PUT', params:{ 'value':'@value' }},
      query: {method:'GET', isArray: true}
    })
}])
.filter('orphansExist', function() {
  return function(orphans, serviceId) {
    var targetOrphans = [];
    angular.forEach(orphans, function(orphan) {
      if (orphan.serviceId === serviceId) {
        targetOrphans.push(orphan);
      }
    });
    return targetOrphans;
  };
})
.controller('NdsLabsController', [ '$scope', '$cookies', '_', 'Services', 'Wizard', 'WizardPage', 'Grid', function($scope, $cookies, _, Services, Wizard, WizardPage, Grid) {
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
  $scope.configuredStacks = [
    {
    "id": "",
    "name": "clowder",
    "status": true,
    "services": [
      {
        "id": "",
        "stackId": "clowder",
        "serviceId": "clowder",
        "status": "Suspended",
        "replicas": 1,
        "endpoints": []
      },
      {
        "id": "",
        "stackId": "clowder",
        "serviceId": "mongo",
        "status": "Suspended",
        "replicas": 1,
        "endpoints": []
      },
      {
        "id": "",
        "stackId": "clowder",
        "serviceId": "rabbitmq",
        "status": "Suspended",
        "replicas": 1,
        "endpoints": []
      },
      {
        "id": "",
        "stackId": "clowder",
        "serviceId": "image-preview",
        "status": "Suspended",
        "replicas": 1,
        "endpoints": []
      }
    ]
  }
  ];
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

  $scope.listRequiredDeps = function(svc) {
    var spec = _.find($scope.deps, function(service) { return service.key === svc.serviceId });
    var required = [];
    angular.forEach(spec.dependencies, function(req, key) {
      if (req === true) {
        required.push(key);
      }
    });
    return required;
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

  $scope.toggleStatus = function(svc) {
    svc.status = !svc.status;
  };

  // The delay (in seconds) before allowing the user to click "Next"
  var initDelay = 0;

  var configPages = [
     new WizardPage("intro", "Introduction", {
        prev: null,
        canPrev: false,
        canNext: function() {
          return $scope.newStack && $scope.newStack.name !== '' && !_.find($scope.configuredStacks, function(stack) { return stack.name === $scope.newStack.name; });
        },
        next: 'config',
        onNext: function() {
          console.log("Verifying that the name " + $scope.newStack.name + " has not already been used by another service...");
          console.log("Gathering optional dependencies and their requirements...");
          $scope.newStackOptionalDeps = {};
          angular.forEach($scope.newStackOptions, function(opt) {
            $scope.newStackOptionalDeps[opt] = $scope.listRequiredDeps(opt);
          });
        }
     }, false),
     new WizardPage("config", "Configuration", {
        prev: 'intro',
        canPrev: true,
        canNext: true,
        next: 'volumes',
        onNext: function() {
          console.log("Adding optional selections to stack...");
          $scope.newStack.services = angular.copy($scope.newStackRequirements);
          angular.forEach($scope.optionalLinksGrid.selector.selection, function(option) {
            var svc = _.find($scope.deps, function(svc) { return svc.key === option.serviceId });
            $scope.collectDependencies(svc);
            $scope.newStack.services.push(createStackSvc($scope.newStack, svc));
          });

          console.log("Discovering volume requirements...");
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
          console.log("Verifying that user has made valid 'Volume' selections...");
        }
     }, true),
     new WizardPage("confirm", "Confirmation", {
        prev: 'volumes',
        canPrev: true,
        canNext: true,
        next: 'finish',
        onNext: function() {
          console.log("Sending create stack / volume requests...");
        }
     }, true),
    new WizardPage("finish", "Success!", {
        prev: 'confirm',
        canPrev: true,
        canNext: false,
        next: null
     }, true)
  ];

  // Create a new Wizard to display
  ($scope.resetWizard = function() { 
    $scope.wizard = new Wizard(configPages, initDelay);
  })();

  $scope.allServices = Services.query(function(data, xhr) {
    console.log("success!");
    $scope.deps = angular.copy(data);
    $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true  });
  }, function (headers) {
    console.log("error!");
    console.debug(headers);
  });

  var createStack = function(template) {
    return {
      id: "",
      name: "",
      status: "Suspended",
      services: []
    };
  };

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

  $scope.startWizard = function(template) {
    $scope.newStackLabel = template.label;
    $scope.newStack = createStack(template);

    $scope.newStackOptions = [];
    var pageSize = 100;
    $scope.optionalLinksGrid = new Grid(pageSize, function() { return $scope.newStackOptions; });

    // Add our base service to the stack
    var base = _.find($scope.stacks, function(svc) { return svc.key === template.key });
    $scope.newStack.services.push(createStackSvc($scope.newStack, base));

    // Add required dependencies to the stack
    $scope.collectDependencies(template);

    $scope.newStackRequirements = angular.copy($scope.newStack.services);

    $scope.resetWizard();

    //  TODO: Get that jQuery outta my controller...
    $('#wizardModal').modal('show');
  };

  $scope.discoverVolumeReqs = function(stack) {
    var reusableVolumes = [];
    var requiredVolumes = [];
    angular.forEach(stack.services, function(requestedSvc) {
      var svcSpec = _.find($scope.allServices, function(svc) { return svc.key === requestedSvc.serviceId });
      if (svcSpec.requiresVolume === true) {
        angular.forEach($scope.configuredVolumes, function(volume) {
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
    $scope.configuredStacks.push(newStack);
    angular.forEach($scope.newStackVolumeRequirements, function(vol) {
      // Orphaned volumes are already in the list
      var exists = _.find($scope.configuredVolumes, function(volume) { return vol.name === volume.name; });
      if (!exists) {
        $scope.configuredVolumes.push(vol);
      } else {
        exists.stackId = $scope.newStack.name;
        exists.attachment = $scope.stackId + '-' + exists.serviceId;
      }
    });
  };

  // TODO: Use queue for recursion?
  $scope.collectDependencies = function(targetSvc) {
    angular.forEach(targetSvc.dependencies, function(required, key) {
      var svc = _.find($scope.deps, function(svc) { return svc.key === key });
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
        console.log("Skipping duplicate service: " + svc.key);
      }
    });
  };

  $scope.confirmRemoval = function(stack) {
    $scope.deletionCandidate = stack;
    $('#confirmModal').modal('show');
  };

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
}]);
