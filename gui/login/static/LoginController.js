/* global angular:false */

angular
.module('ndslabs-login')

/**
 * The controller for our "Login" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginController', [ '$scope', '$rootScope', '$cookies', '$routeParams', '$location', '$window', '$log', '$uibModal', 'AuthInfo', 'Project', 'NdsLabsApi', 'DashboardAppPath', 'HomePathSuffix', 'CookieOptions', '$uibModalStack', 'ServerData', 'ProductName', 'ReturnRoute', 'SigninUrl',
    function($scope, $rootScope, $cookies, $routeParams, $location, $window, $log, $uibModal, authInfo, Project, NdsLabsApi, DashboardAppPath, HomePathSuffix, CookieOptions, $uibModalStack, ServerData, ProductName, ReturnRoute, SigninUrl) {
  "use strict";

  $rootScope.rd = '';
  if ($routeParams.rd) {
    ReturnRoute = $routeParams.rd;
    $rootScope.rd = encodeURIComponent(ReturnRoute);
  }

  $scope.productName = ProductName;
  
  // Grab our injected AuthInfo from the provider
  $scope.settings = authInfo.get();
  
  $scope.$watch(function() { return Project.project; }, function(newValue, oldValue) { $scope.project = newValue; });
  
  $scope.enableOAuth = SigninUrl.indexOf("/oauth2/") !== -1;
  $scope.signinLink = $scope.enableOAuth ? SigninUrl : '/login/' + ($rootScope.rd ? 'rd=' : '');
  
  // User should not be here if OAuth is enabled...
  // Navigate them to the correct place
  if ($scope.enableOAuth) {
    $window.location.href = $scope.signinLink;
    return;
  };
  
  $scope.clickCreateAccountLink = function() {
    if ($scope.enableOAuth) { return false; }
    $window.location.href = '/login/register' + ($rootScope.rd ? '?rd=' + $rootScope.rd : '')
  };
  
  $scope.clickForgotPasswordLink = function() {
    if ($scope.enableOAuth) { return false; }
    $window.location.href = '/login/recover' + ($rootScope.rd ? '?rd=' + $rootScope.rd : '')
  };
  
  /**
   * Start a local session by asking the server for a token
   */
  $scope.login = function() {
    $log.debug("Logging in!");
    $scope.progressMessage = 'Please wait...';
    $scope.errorMessage = '';
    
    // POST to /authenticate to create a token
    NdsLabsApi.postAuthenticate({
      "auth": { 
        "username": $scope.settings.namespace, 
        "password": $scope.settings.password 
      }
    }).then(function(data, xhr) {
      $scope.errorMessage = '';
      
      // TODO: cauth server should set this for us, but doesn't seem to be working
      // FIXME: parameterize domain or connect to cauth endpoint
      $cookies.put('namespace', $scope.settings.namespace, CookieOptions);
      $cookies.put('token', data.token, CookieOptions);
      
      $log.debug("Logged in!");
      //getProject();
      
      // HACK: this pattern does not scale very well
      // If we were given an "rd" parameter, redirect to it on successful login
      var rd = $routeParams.rd;
      if (rd) {
        $window.location.href = rd;
      } else {
        $window.location.href = DashboardAppPath + HomePathSuffix;
      }
    }, function(response) {
      var body = response.body || { 'Error': 'Something went wrong. Is the server running?' };
      $scope.errorMessage = response.status === 401 ? 'Invalid username or password' : body.Error;
      $log.error("Error logging in!");
    }).finally(function() {
      $scope.progressMessage = '';
    });
  };

  /**
   * End our local session by deleting our token. This will bounce the
   * user back out to the login page, forcing them to re-authenticate
   * TODO: How do we end the session server-side?
   */
  $scope.logout = function() {
    $log.debug("Logging out!");
    
    // TODO: DELETE /authenticate to delete a token in the backend?
    //NdsLabsApi.deleteAuthenticate().then(function(data, xhr) {
      $scope.errorMessage = '';
      $scope.progressMessage = '';
      $log.debug("Logging out!");
      authInfo.purge();
    /*}, function(response) {
      $log.error("Error logging out!");
    }).finally(function() {*/
    //});
  };
}]);
