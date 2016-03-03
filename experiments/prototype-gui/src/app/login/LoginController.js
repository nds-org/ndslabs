angular
.module('ndslabs')
.controller('LoginController', [ '$scope', '$cookies', '$location', '$log', 'AuthInfo', 'NdsLabsApi', 'ExpressRoute', 'LoginRoute', 'ExpertRoute',
    function($scope, $cookies, $location, $log, authInfo, NdsLabsApi, ExpressRoute, LoginRoute, ExpertRoute) {
  $scope.settings = authInfo.get();
  
  var HomeRoute = ExpertRoute; //ExpressRoute;
  
  if ($scope.settings.authenticated) {
    $location.path(HomeRoute);
  } else {
    $location.path(LoginRoute);
  }
  
  $scope.login = function() {
    $log.debug("Logging in!");
    $scope.progressMessage = 'Please wait...';
    $scope.errorMessage = '';
    NdsLabsApi.postAuthenticate({
      "auth": { 
        "username": $scope.settings.namespace, 
        "password": $scope.settings.password 
      }
    }).then(function(data, xhr) {
      $log.debug("Logged in!");
      $scope.errorMessage = '';
      //$scope.settings.authenticated = true;
      /*if ($scope.settings.saveCookie === true) {
        $cookies.putObject('auth', $scope.settings);
      }*/
      $cookies.put('namespace', $scope.settings.namespace);
      $location.path(HomeRoute);
    }, function(response) {
      $scope.errorMessage = response.status === 401 ? 'Invalid namespace or password' : response.body.Error;
      $log.error("Error logging in!");
    }).finally(function() {
      $scope.progressMessage = '';
    });
  };

  $scope.logout = function() {
    $log.debug("Logging out!");
    NdsLabsApi.deleteAuthenticate().then(function(data, xhr) {
      $log.debug("Logged out!");
      $scope.errorMessage = '';
      $cookies.remove('token');
      $cookies.remove('namespace');
      $location.path(LoginRoute);
    }, function(response) {
      $log.error("Error logging out!");
    }).finally(function() {
      $scope.progressMessage = '';
    });
  };
}]);
