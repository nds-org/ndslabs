/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Catalog" view
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('CatalogController', [ '$scope', '$log', '$location', '$routeParams', '_', 'NdsLabsApi', 'Specs', function($scope, $log, $location, $routeParams, _, NdsLabsApi, Specs) {
  // If a key is given, this is an edit, otherwise it is an add
  if ($routeParams.key) {
    // Update view when our spec list reloads
    $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) {
      if (newValue) {
        $scope.spec = _.find(Specs.all, [ 'key', $routeParams.key ]); 
        $scope.key = $scope.spec.key || '';
      }
    });
  }
  
  // Save the changes made on this page
  $scope.save = function() {
    NdsLabsApi.putServicesByServiceId({ service: $scope.spec, serviceId: $scope.key }).then(function(data, b, c) {
      console.log("Successfully PUT service: " + $scope.key);
    });
      
    $location.path('/home');
  };
  
  // Cancel the changes made on this page
  $scope.cancel = function() {
    $location.path('/home');
  };
}]);