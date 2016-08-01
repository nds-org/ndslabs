/* global angular:false */

angular
.module('ndslabs')
.filter('invertSpecList', [ '$filter', 'Specs', '_', function($filter, Specs, _) {
  return function(input) {
    return _.remove(angular.copy(Specs.all), function(spec) {
      return !_.find(input, [ 'key', spec.key ]);
    });
  };
}])
/**
 * The Controller for our "Add Spec" / "Edit Spec" views
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddOrEditSpecController', [ '$scope', '$log', '$location', '$routeParams', '_', 'NdsLabsApi', 'Specs', 'Spec', 'Vocabulary',  function($scope, $log, $location, $routeParams, _, NdsLabsApi, Specs, Spec, Vocabulary) {
  var path = $location.path();
  //$scope.editingSpec = (path.indexOf('edit') !== -1);
  $scope.editingSpec = (path.indexOf('/edit/') !== -1);
  
  
  Vocabulary.populate("tags").then(function(data) {
    $scope.tags = data.terms;
  });
  
  $scope.addKeyword = function(keyword) {
    if ($scope.spec.tags.indexOf(keyword) === -1) { 
      $scope.spec.tags.push(keyword);
    }
  };
  
  $scope.deleteKeyword = function(keyword) {
    var index = $scope.spec.tags.indexOf(keyword);
    if (index !== -1) {
      $scope.spec.tags.splice(index, 1);
    }
  };
  
  $scope.forms = {};
  
  $scope.specs = Specs.all;
  
  // Set up some common defaults
  $scope.portProtocol = 'http';
  $scope.portNumber = 0;
  $scope.portExposure = 'external';
  
  $scope.$watch('spec.key', function(newValue, oldValue) {
    if (newValue && !$scope.editingSpec) {
      $scope.keyUnique = !_.find(Specs.all, [ 'key', newValue ]);
    } else {
      $scope.keyUnique = true;
    }
  })

  // Update view when our spec list reloads
  $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) {
    if (!newValue) {
      return;
    }
    
    $scope.specs = newValue;
    
    // If a key is given, this is an edit, otherwise it is an add
    if ($scope.editingSpec) {
      $scope.key = $routeParams.specKey;
      NdsLabsApi.getServicesByServiceId({ serviceId: $scope.key }).then(function(data) {
        $scope.spec = data;
        $scope.spec.tags = $scope.spec.tags || [];
        $scope.spec.image.tags = $scope.spec.image.tags || [];
      });
    } else {
      $scope.spec = new Spec();
    }
  });
  
  $scope.removeItem = function(target, obj) {
    target.splice(target.indexOf(obj), 1);
  };
  
  $scope.addItem = function(targetName, obj) {
    if (!$scope.spec[targetName]) {
      $scope.spec[targetName] = [];
    }
    $scope.spec[targetName].push(obj);
  };
  
  // Save the changes made on this page
  $scope.save = function() {
    var method = $scope.editingSpec ? 'putServicesByServiceId' : 'postServices';
    
    return NdsLabsApi[method]({ service: $scope.spec, serviceId: $scope.spec.key }).then(function(data, b, c) {
      // TODO: Only populate changed spec?
      Specs.populate().then(function() {
        $location.path('/store');
      });
    });
  };
  
  $scope.cancel = function() {
    // Add the new stack to the UI
    $location.path('/store');
  };
}]);