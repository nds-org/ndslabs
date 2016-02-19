'use strict';

angular
.module('ndslabs', [ 'navbar', 'footer', 'ngWizard', 'ngGrid', 'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'ui.bootstrap' ])
.provider('AuthInfo', function() {
    this.authInfo = {
      authenticated: false,
      namespace: '',
      password: '',
      saveCookie: false
    };

    this.$get = function() {
        var authInfo = this.authInfo
        return {
            isAuth: function() {
                return authInfo.authenticated;
            },
            get: function() {
                return authInfo;
            }
        }
    };

    this.setAuth = function(authCookie) {
        this.authInfo = authCookie;
    };
})
.config([ '$routeProvider', '$cookiesProvider', 'AuthInfoProvider', function($routeProvider, $cookiesProvider, authInfo) {
  var cookies = $cookiesProvider.$get();
  if (cookies && cookies['auth']) {
    authInfo.setAuth(angular.fromJson(cookies['auth']));
  }  

  $routeProvider.when('/labs', {
    controller: 'NdsLabsController',
    templateUrl: '/app/ndslabs/ndslabs.html'
  })
  .when('/login', {
    controller: 'LoginController',
    templateUrl: '/app/ndslabs/login.html'
  })
  .otherwise({
    redirectTo: function(routeParams, path, search) {
      console.log(routeParams);
      console.log(path);
      console.log(search);
      
      if (authInfo.isAuth() === true) {
        return '/labs';
      } else {
        return '/login';
      }
    }
  });
}])
.run([ '$rootScope', '$location', 'AuthInfo', function($rootScope, $location, authInfo) {
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    if (authInfo.isAuth() === false) {

      // user needs to log in, redirect to /login
      if (next.templateUrl !== "/app/ndslabs/login.html") {
        $location.path("/login");
      }
    }
  });
}]);
