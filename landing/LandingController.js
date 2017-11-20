/* global angular:false */

angular
.module('ndslabs-landing', ['ndslabs-api'])

/**
 * The route to our "Recover Password" View
 */
.constant('ResetPasswordRoute', '/recover')
/**
 * The back-up (default) administrator e-mail to use for support, 
 * in case the /api/contact endpoint is unavailable
 */
.constant('SupportEmail', 'lambert8@illinois.edu')

/**
 * The name of the product to display in the UI and the URL to link to when clicked
 */
 
.constant('OrgName', 'NDS')
.constant('ProductName', 'Labs Workbench')
.constant('ProductUrl', 'http://www.nationaldataservice.org/projects/labs.html')

/**
 * The version/revision of this GUI
 */
.constant('BuildVersion', '1.0.13-devel')
.constant('BuildDate', '')

/**
 * Hostname / Port for communicating with etcd
 * 
 * This must be the external IP and nodePort (when running in k8)
 * 
 * TODO: We assume this is running on the same machine as the apiserver.
 */ 
.constant('ApiHost', 'www.mldev.ndslabs.org')
.constant('ApiPort', '')
.constant('ApiPath', '/api')
.constant('ApiSecure', true) 

.constant('WebsocketPath', '/console')

/** Store our built ApiUri here */
.value('ApiUri', { api: '', ws: '' })

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
