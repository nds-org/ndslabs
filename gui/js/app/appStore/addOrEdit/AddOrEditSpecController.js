/* global angular:false */

angular
.module('ndslabs')
.filter('invertSpecList', [ '$filter', 'Specs', '_', function($filter, Specs, _) {
  return function(input) {
    return _.remove(angular.copy(Specs.all), function(spec) {
      return spec.display !== '' && spec.display !== 'none' && !_.find(input, [ 'key', spec.key ]);
    });
  };
}])
/**
 * The Controller for our "Add Spec" / "Edit Spec" views
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddOrEditSpecController', [ '$scope', '$log', '$location', '$routeParams', '_', 'NdsLabsApi', 'Specs', 'Spec', function($scope, $log, $location, $routeParams, _, NdsLabsApi, Specs, Spec) {
  var path = $location.path();
  //$scope.editingSpec = (path.indexOf('edit') !== -1);
  $scope.editingSpec = (path.indexOf('/edit/') !== -1);
  
  // If a key is given, this is an edit, otherwise it is an add
  if ($scope.editingSpec) {
    // Update view when our spec list reloads
    $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) {
      if (newValue && newValue.length) {
        $scope.specs = newValue;
        $scope.key = $routeParams.specKey;
        NdsLabsApi.getServicesByServiceId({ serviceId: $scope.key }).then(function(data) {
          $scope.spec = data;
          
          if (!$scope.spec.image.tags) {
            $scope.spec.image.tags = [];
          }
        });
      }
    });
  } else {
    $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) { 
      $scope.specs = newValue;
      $scope.spec = new Spec();
    });
  }
  
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
    if ($scope.editingSpec) {
      return NdsLabsApi.putServicesByServiceId({ service: $scope.spec, serviceId: $scope.spec.key }).then(function(data, b, c) {
        console.log("Successfully PUT service: " + $scope.key);
        
        // TODO: Only populate changed spec?
        Specs.populate().then(function() {
          $location.path('/store');
        });
      });
    } else {
      return NdsLabsApi.postServices({ service: $scope.spec }).then(function(data, b, c) {
        console.log("Successfully POST service: " + $scope.key);
        
        // TODO: Only populate new spec?
        Specs.populate().then(function() {
          $location.path('/store');
        });
      });
    }
  };
  
  $scope.cancel = function() {
    // Add the new stack to the UI
    $location.path('/home');
  };
}]);