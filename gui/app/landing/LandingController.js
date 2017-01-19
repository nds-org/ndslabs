/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Landing Page" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LandingController', [ '$scope', '$location', '$routeParams', '$log', '_', 'AuthInfo', 'OrgName', 'ProductName', 'ProductUrl', 'NdsLabsApi', 'HelpLinks', 'ResetPasswordRoute',
    function($scope, $location, $routeParams, $log, _, AuthInfo, OrgName, ProductName, ProductUrl, NdsLabsApi, HelpLinks, ResetPasswordRoute) {
  "use strict";

  if ($routeParams.t && !$routeParams.u) {
    $location.path(ResetPasswordRoute);
    return;
  }    
      
  $scope.orgName = OrgName;
  $scope.productName = ProductName;
  $scope.productUrl = ProductUrl;
  $scope.helpLinks = HelpLinks;
  
  $scope.auth = AuthInfo.get();
  
  $scope.featureLink = _.find($scope.helpLinks, [ 'name', 'Feature Overview' ]);
  
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
