/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Login" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginController', [ '$scope', '$cookies', '$location', '$log', '$uibModal', 'AuthInfo', 'NdsLabsApi', 'LoginRoute', 'HomeRoute', 'VerifyAccountRoute', 'ResetPasswordRoute', '$uibModalStack', 'ServerData', 'SignUpRoute',
    function($scope, $cookies, $location, $log, $uibModal, authInfo, NdsLabsApi, LoginRoute, HomeRoute, VerifyAccountRoute, ResetPasswordRoute, $uibModalStack, ServerData, SignUpRoute) {
  // Grab our injected AuthInfo from the provider
  $scope.settings = authInfo.get();
  $scope.showVerify = false;
  
  var getProject = function() {
    ServerData.project.populate($scope.settings.namespace).then(function(data) {
      $scope.settings.project = data;
    });
  };
  
  // If we found a token, the user should be sent to the HomePage to check its validity
  var path = $location.path();
  if (path !== VerifyAccountRoute && path !== ResetPasswordRoute && path !== SignUpRoute) {
    if (!$scope.settings.token) {
      $location.path(LoginRoute);
    } else {
      getProject();
    }
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
      getProject();
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
      $scope.settings.token = null;
      $cookies.remove('token');
      $cookies.remove('namespace');
      $uibModalStack.dismissAll();
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
    // See 'app/login/signUp/signUp.html
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/login/signUp/signUp.html',
        controller: 'SignUpController',
        size: 'md',
        keyboard: false,
        backdrop: 'static',
        resolve: { 
          username: function() { $scope.settings.namespace }, 
          password: function() { $scope.settings.password }
        }
      });
      
      // Define what we should do when the modal is closed
      modalInstance.result.then(function(account) {
        $log.debug('User has successfully created a new account: ' + account.username);
        
        $scope.showVerify = true;
      });
  };
}]);
