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
    $scope.errorMessage = '';
    NdsLabsApi.postAuthenticate({
      "auth": { 
        "username": $scope.settings.namespace, 
        "password": $scope.settings.password 
      }
    }).then(function(data, xhr) {
      $log.debug("Logged in!");
      $scope.errorMessage = '';
      $scope.settings.authenticated = true;
      /*if ($scope.settings.saveCookie === true) {
        $cookies.putObject('auth', $scope.settings);
      }*/
      $location.path(HomeRoute);
    }, function(response) {
      $scope.errorCode = response.status;
      $scope.errorMessage = "Invalid credentials.";
      $log.error("Error logging in!");
    });
  };

  $scope.logout = function() {
    $log.debug("Logged out!");
    $scope.settings.authenticated = false;
    $cookies.remove('auth');
    $location.path(LoginRoute);
  };
}]);
