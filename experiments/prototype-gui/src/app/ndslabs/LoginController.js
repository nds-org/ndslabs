angular
.module('ndslabs')
.controller('LoginController', [ '$scope', '$cookieStore', '$location', 'AuthInfo', function($scope, $cookies, $location, authInfo) {
  $scope.settings = authInfo.get();
  $scope.errorMessage = '';
  
  if ($scope.settings.authenticated) {
    $location.path('/labs');
    return;
  }
  
  $scope.login = function() {
    $scope.settings.authenticated = true;
    if ($scope.settings.saveCookie === true) {
      $cookies.put('auth', $scope.settings);
    }
    $location.path('/labs');
  };

  $scope.logout = function() {
    $scope.settings.authenticated = false;
    $cookies.remove('auth');
    $location.path('/login');
  };
}]);
