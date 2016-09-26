/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Landing Page" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LandingController', [ '$scope', '$location', '$routeParams', '$log', '_', 'AuthInfo', 'OrgName', 'ProductName', 'NdsLabsApi', 'HelpLinks',  
    function($scope, $location, $routeParams, $log, _, authInfo, OrgName, ProductName, NdsLabsApi, HelpLinks) {
  $scope.orgName = OrgName;
  $scope.productName = ProductName;
  $scope.helpLinks = HelpLinks;
  
  $scope.featureLink = _.find($scope.helpLinks, [ 'name', 'Feature Overview' ]);
  $scope.eulaLink = _.find($scope.helpLinks, [ 'name', 'Acceptable Use Policy' ]);
  
  $scope.token = $routeParams.t;
  $scope.user = $routeParams.u;
  
  $scope.productName = ProductName;
  
  if ($scope.user && $scope.token) {
    $scope.verified = null;
    NdsLabsApi.putRegisterVerify({ verify: { u: $scope.user, t: $scope.token } }).then(function(data) {
      console.debug(data);
      $scope.verified = true;
    }, function(response) {
      $log.error("Failed to verify user " + $scope.user + ":" + $scope.token);
      $scope.verified = false;
    });
  }
}]);
