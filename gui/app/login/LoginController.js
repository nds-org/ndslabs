/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Login" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginController', [ '$scope', '$cookies', '$location', '$log', '$uibModal', 'AuthInfo', 'Project', 'NdsLabsApi', 'LoginRoute', 'HomeRoute', 'VerifyAccountRoute', 'ResetPasswordRoute', '$uibModalStack', 'ServerData', 'SignUpRoute', 'ContactUsRoute', 'LandingRoute', 'ProductName',
    function($scope, $cookies, $location, $log, $uibModal, authInfo, Project, NdsLabsApi, LoginRoute, HomeRoute, VerifyAccountRoute, ResetPasswordRoute, $uibModalStack, ServerData, SignUpRoute, ContactUsRoute, LandingRoute, ProductName) {
  "use strict";

  $scope.productName = ProductName;
  
  // Grab our injected AuthInfo from the provider
  $scope.settings = authInfo.get();
  
  $scope.$watch(function() { return Project.project; }, function(newValue, oldValue) { $scope.project = newValue; });
  
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
      $cookies.put('namespace', $scope.settings.namespace);
      $log.debug("Logged in!");
      //getProject();
      $location.path(HomeRoute);
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
  
  var path = $location.path();
  
  // If we found a token, the user should be sent to the HomePage to check its validity;
  if (path === LoginRoute && authInfo.get().token) {
    $log.debug("Found token on an unauth view... routing Home");
    $location.path(HomeRoute);
  }
}]);
