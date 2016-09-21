/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Verify Account" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('VerifyAccountController', [ '$scope', '$location', '$routeParams', '$log', 'HomeRoute', 'NdsLabsApi', 'ProductName', 
    function($scope, $location, $routeParams, $log, HomeRoute, NdsLabsApi, ProductName) {
  $scope.token = $routeParams.t;
  $scope.user = $routeParams.u;
  $scope.verified = null;
  
  $scope.productName = ProductName;
  
  if (!$scope.user || !$scope.token) {
    $location.path(HomeRoute);
  } else {
    NdsLabsApi.putRegisterVerify({ verify: { u: $scope.user, t: $scope.token } }).then(function(data) {
      console.debug(data);
      $scope.verified = true;
    }, function(response) {
      $log.error("Failed to verify user " + $scope.user + ":" + $scope.token);
      $scope.verified = false;
    });
  }
}]);
