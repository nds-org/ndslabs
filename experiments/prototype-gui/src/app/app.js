'use strict';

angular
.module('ndslabs', [ 'navbar', 'footer', 'ngWizard', 'ngGrid', 'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'toggle-switch', 'ui.bootstrap' ])
.constant('_', window._)
.provider('AuthInfo', function() {
    this.authInfo = {
      authenticated: false,
      namespace: '',
      password: '',
      saveCookie: false
    };

    this.$get = function() {
        var authInfo = this.authInfo;
        return {
            isAuth: function() { return authInfo.authenticated; },
            get: function() { return authInfo; },
            setAuth: function(authCookie) { authInfo = angular.fromJson(authCookie); }
        }
    };
})
.config([ '$routeProvider', 'AuthInfoProvider', function($routeProvider, authInfo) {
  $routeProvider.when('/labs', {
    controller: 'NdsLabsController',
    templateUrl: '/app/ndslabs/ndslabs.html'
  })
  .when('/login', {
    controller: 'LoginController',
    templateUrl: '/app/ndslabs/login.html'
  })
  .otherwise({
//    redirectTo: '/login'
    redirectTo: function() {
      if (authInfo.isAuth() === true) {
        $location.path('/labs');
      } else {
        $location.path('/login');
      }
    }
  });
}])
.run([ '$rootScope', '$location', '$cookies', 'AuthInfo', function($rootScope, $location, $cookies, authInfo) {
  var authCookie;
  if ($cookies && (authCookie = $cookies.getObject('auth'))) {
    authInfo.setAuth(authCookie);
  }

  // TODO: Investigate performance concerns here
  $rootScope._ = window._;
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    if (authInfo.isAuth() === false) {

      // user needs to log in, redirect to /login
      if (next.templateUrl !== "/app/ndslabs/login.html") {
        $location.path("/login");
      }
    }
  });
}]);
