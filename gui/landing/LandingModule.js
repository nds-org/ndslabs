/* global angular:false */

angular
.module('ndslabs-landing', [ 'ngRoute', 'ngCookies', 'navbar', 'footer', 'ndslabs-config', 'ndslabs-api', 'angular-google-analytics', 'swaggerUi' ])

.constant('LandingAppRoute', '/landing/#')
.constant('LandingPathSuffix', '/')
.constant('ContactUsPathSuffix', '/contact')
.constant('ApiRefPathSuffix', '/swagger')

/**
 * Configure routes / HTTP for our app using the services defined above
 */
.config([ '$routeProvider', 'ProductName', 'LandingAppRoute', 'LandingPathSuffix', 'ContactUsPathSuffix', 'ApiRefPathSuffix',
    function($routeProvider, ProductName, LandingAppRoute, LandingPathSuffix, ContactUsPathSuffix, ApiRefPathSuffix) {
  "use strict";
      
  $routeProvider
    .when(LandingPathSuffix, {
      title: ProductName + ' Landing Page',
      controller: 'LandingController',
      templateUrl: 'landing.html',
      pageTrack: LandingAppRoute + LandingPathSuffix
    })
    .when(ContactUsPathSuffix, {
      title: 'Contact ' + ProductName + ' Support',
      controller: 'HelpController',
      templateUrl: 'help/help.html',
      pageTrack: LandingAppRoute + ContactUsPathSuffix
    })
    .when(ApiRefPathSuffix, {
      title: ProductName + ' API Reference',
      controller: 'SwaggerController',
      templateUrl: 'swagger/swagger.html',
      pageTrack: LandingAppRoute + ApiRefPathSuffix
    }).otherwise(LandingPathSuffix);
}])

/**
 * The controller for our "Landing Page" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LandingController', [ '$scope', '$rootScope', '$location', '$routeParams', '$log', '_', 'AuthInfo', 'OrgName', 'ProductName', 'ProductUrl', 'NdsLabsApi', 'HelpLinks', 'ReturnRoute',
    function($scope, $rootScope, $location, $routeParams, $log, _, AuthInfo, OrgName, ProductName, ProductUrl, NdsLabsApi, HelpLinks, ReturnRoute) {
  "use strict";

  if ($routeParams.t && !$routeParams.u) {
    //$location.path(ResetPasswordRoute);
    return;
  }
  
  $rootScope.rd = '';
  if ($routeParams.rd) {
    ReturnRoute = $routeParams.rd;
    $rootScope.rd = encodeURIComponent(ReturnRoute);
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
  
  // TODO: Move this logic to the LoginModule
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
