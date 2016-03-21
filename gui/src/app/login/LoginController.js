/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our Login View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginController', [ '$scope', '$cookies', '$location', '$log', '$uibModal', 'AuthInfo', 'NdsLabsApi', 'ExpressRoute', 'LoginRoute', 'ExpertRoute',
    function($scope, $cookies, $location, $log, $uibModal, authInfo, NdsLabsApi, ExpressRoute, LoginRoute, ExpertRoute) {
  // Grab our injected AuthInfo from the provider
  $scope.settings = authInfo.get();
  
  var HomeRoute = ExpertRoute; //ExpressRoute;
  
  // If we found a token, the user should be sent to the HomePage to check its validity
  if ($scope.settings.token) {
    $location.path(HomeRoute);
  } else {
    $location.path(LoginRoute);
  }

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
      $location.path(HomeRoute);
    }, function(response) {
      var body = response.body || { 'Error': 'Something went wrong. Is the server running?' };
      $scope.errorMessage = response.status === 401 ? 'Invalid namespace or password' : body.Error;
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
      $scope.settings.token = null;
      $cookies.remove('token');
      $cookies.remove('namespace');
      $log.debug("Logged out!");
      $location.path(LoginRoute);
    /*}, function(response) {
      $log.error("Error logging out!");
    }).finally(function() {*/
      $scope.progressMessage = '';
    //});
  };

  /**
   * Create a new project in etcd (DEBUG / DEMO only!)
   * TODO: Remove this ASAP!
   */
  $scope.signUp = function() {
    // See '/app/login/modals/signUp/signUp.html
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/app/login/modals/signUp/signUp.html',
        controller: 'SignUpController',
        size: 'md',
        keyboard: false,
        backdrop: 'static',
        resolve: {  }
      });
      
      // Define what we should do when the modal is closed
      modalInstance.result.then(function(project) {
        $log.debug('User has successfully created a new project: ' + project.namespace);
        
        // Now log in to the new account
        $scope.settings.namespace = project.namespace;
        $scope.settings.password = project.password;
        $scope.login();
      });
  };
}]);
