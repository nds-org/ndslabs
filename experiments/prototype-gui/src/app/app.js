'use strict';

angular
.module('ndslabs', [ 'navbar', 'footer', 'ndslabs-api', 'ngWizard', 'ngGrid', 'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'toggle-switch', 'ui.bootstrap' ])
.constant('_', window._)
.constant('Google', window.google)
.constant('LoginRoute', '/login')
.constant('ExpressRoute', '/express')
.constant('ExpertRoute', '/home')
.constant('ManageRoute', '/deployments')
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
.config([ '$routeProvider', 'AuthInfoProvider', 'LoginRoute', 'ExpressRoute', 'ExpertRoute', 'ManageRoute',
    function($routeProvider, authInfo, LoginRoute, ExpressRoute, ExpertRoute, ManageRoute) {
  $routeProvider.when(ExpertRoute, {
    controller: 'ExpertSetupController',
    templateUrl: '/app/expert/expertSetup.html'
  })
  .when(LoginRoute, {
    controller: 'LoginController',
    templateUrl: '/app/login/login.html'
  })
  /*.when(ExpressRoute, {
    controller: 'ExpressSetupController',
    templateUrl: '/app/express/expressSetup.html'
  })*/
  .when(ManageRoute, {
    controller: 'DeploymentsController',
    templateUrl: '/app/deployments/manage.html'
  })
  .otherwise({
    redirectTo: function() {
      if (authInfo.authInfo.authenticated === true) {
        return ExpertRoute; //ExpressRoute;
      } else {
        return LoginRoute;
      }
    }
  });
}])
.run([ '$rootScope', '$location', '$cookies', 'AuthInfo', 'LoginRoute', function($rootScope, $location, $cookies, authInfo, LoginRoute) {
  var authCookie;
  if ($cookies && (authCookie = $cookies.getObject('auth'))) {
    authInfo.setAuth(authCookie);
  }

  // TODO: Investigate performance concerns here...
  $rootScope._ = window._;
  $rootScope.google = window.google;
  
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    if (authInfo.isAuth() === false) {
      
      // TODO: Allow login page to reroute user to destination?
      //authInfo.returnRoute = next.$$route.originalPath;

      // user needs to log in, redirect to /login
      if (next.templateUrl !== "/app/login/login.html") {
        $location.path(LoginRoute);
      }
    }
  });
}]);
