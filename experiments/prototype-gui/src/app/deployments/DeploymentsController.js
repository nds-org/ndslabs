angular
.module('ndslabs')
.controller('DeploymentsController', [ '$scope', '$log', '_', 'Services', function($scope, $log, _, Services) {
  var createStackSvc = function(stack, svc) {
    return {
      id: "",
      stack: stack.name,
      service: svc.key,
      status: "Suspended",
      replicas: 1,
      endpoints: []
    };
  };

  // Stacks test data
  $scope.deployedStacks = [
    {
      "id": "",
      "name": "clowder",
      "key": "clowder",
      "status": true,
      "services": [
        {
          "id": "",
          "stack": "clowder",
          "service": "clowder",
          "status": false,
          "replicas": 1,
          "endpoints": []
        },
        {
          "id": "",
          "stack": "clowder",
          "service": "mongo",
          "status": false,
          "replicas": 1,
          "endpoints": []
        },
        {
          "id": "",
          "stack": "clowder",
          "service": "rabbitmq",
          "status": false,
          "replicas": 1,
          "endpoints": []
        },
        {
          "id": "",
          "stack": "clowder",
          "service": "image-preview",
          "status": false,
          "replicas": 1,
          "endpoints": []
        }
      ]
    }
  ];
  
  Services.query(function(data, xhr) {
    $log.debug("success!");
    $scope.deps = angular.copy(data);
    $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true  });
  }, function (headers) {
    $log.debug("error!");
    console.debug(headers);
  });
  
  $scope.showVolume = function(stack, svc) {
    var volume = null;
    angular.forEach($scope.configuredVolumes, function(vol) {
      if (stack.name === vol.stack && svc.service === vol.service) {
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
    
    

/*
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
  
  $scope.addStackSvc = function(stack, svcName) {
    var spec = _.find($scope.deps, { 'key': svcName });
    if (spec) {
      // Ensure this does not require new dependencies
      angular.forEach(spec.dependencies, function(required, key) {
        var svc = _.find($scope.deps, function(svc) { return svc.key === key });
        var stackSvc = createStackSvc(stack, svc);
        
        // Check if this service is already present on our proposed stack
        var exists = _.find(stack.services, function(svc) { return svc.service === key });
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
        if (volume.stack === stack.name) {
          volume.attachment = null;
        }
      });
    }
  };
}]);