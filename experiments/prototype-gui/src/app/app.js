'use strict';

angular
.module('ndslabs', [ 'navbar', 'footer', 'ndslabs-api', 'ngWizard', 'ngGrid', 
    'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'toggle-switch', 'pageslide-directive', 'ui.bootstrap' ])
    
// Display verbose JSON debug data
.constant('DEBUG', true)

// TODO: Whether or not to use mock data (false if talking to live etcd)
.constant('MOCKDATA', false)

// Define some global constants to inject (third-party libraries)
.constant('_', window._)
.constant('Google', window.google)

// Define the routes for our app here to easily parameterize them
.constant('LoginRoute', '/login')
.constant('ExpressRoute', '/express')
.constant('ExpertRoute', '/home')
.constant('ManageRoute', '/deployments')

// Logic for communicating with etcd (powered by swagger-js-codegen)
.constant('ApiUri', 'http://141.142.209.154:8083')
.factory('NdsLabsApi', [ 'ApiUri', 'ApiServer', function(ApiUri, ApiServer) {
  // TODO: Investigate options / caching
  return new ApiServer(ApiUri);
}])

.provider('AuthInfo', function() {
  this.authInfo = {
    namespace: '',
    password: '',
    saveCookie: false,
    project: null,
    token: null
  };

  this.$get = function() {
      var authInfo = this.authInfo;
      return {
          get: function() { return authInfo; }
      }
  };
})

// Configure routes / HTTP for our app using what we defined above
.config([ '$routeProvider', '$httpProvider', 'AuthInfoProvider', 'LoginRoute', 'ExpressRoute', 'ExpertRoute', 'ManageRoute',
    function($routeProvider, $httpProvider, authInfo, LoginRoute, ExpressRoute, ExpertRoute, ManageRoute) {
  // Setup default behaviors for encountering errors
  $httpProvider.interceptors.push(['$rootScope', '$cookies', '$q', '$location', '$log', '_', 'DEBUG', 'ApiUri', 'AuthInfo',
      function (scope, $cookies, $q, $location, $log, _, DEBUG, ApiUri, AuthInfo) {
    return {
      'request': function(config) {
        if (_.includes(config.url, ApiUri)) {
          if (DEBUG) {
            $log.debug('Request:');
            console.debug(config);
          }
          // This is a request for our API server
          if (!_.includes(config.url, '/authenticate')) {
            // We need to attach our token to this request
            config.headers['Authorization'] = 'Bearer ' + $cookies.get('token');
          }
        }
        return config;
      },
      'requestError': function(rejection) {
        if (rejection.config.url.indexOf(ApiUri) !== -1) {
          if (DEBUG) {
            $log.debug('Request Rejection:');
            console.debug(rejection);
          }
        }
        return $q.reject(rejection);
      },
      'response': function(response) {
        if (_.includes(response.config.url, ApiUri)) {
          // This is a response from our API server
          if (DEBUG) {
            $log.debug("Response:")
            console.debug(response);
          }
        
          if ((_.includes(response.config.url, '/authenticate') && response.config.method === 'POST')
              || (_.includes(response.config.url, '/refresh_token') && response.config.method === 'GET')) {
            // This response should contain a new token, so save it
            $cookies.put('token', response.data.token);
          }
        }
        
        return response;
      },
      'responseError': function(rejection) {
        // Ignore local communication errors?
        if (rejection.config.url.indexOf(ApiUri) !== -1) {
          if (DEBUG) {
            $log.debug("Response Rejection:");
            console.debug(rejection);
          }
        
          var status = rejection.status;
          if (status == 401) {
            
            // TODO: If we want to intercept the route to redirect them after a successful login
            //window.location = "/account/login?redirectUrl=" + Base64.encode(document.URL);
            
            authInfo.authInfo.token = null;
            $cookies.remove('token')
            if ($location.path() !== LoginRoute) {
              $location.path(LoginRoute);
            }
            return $q.reject(rejection);
          }
        }
        
        // otherwise
        return $q.reject(rejection);
      }
    };
  }]);
      
  // Setup routes to our different pages
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
  })
  .when(ManageRoute, {
    controller: 'DeploymentsController',
    templateUrl: '/app/deployments/manage.html'
  })*/
  .otherwise({ redirectTo: LoginRoute });
}])

// Once configured, run this section of code to finish bootstrapping our app
.run([ '$rootScope', '$location', '$log', '$cookies', 'AuthInfo', 'LoginRoute', 'ExpertRoute', 'NdsLabsApi', 
    function($rootScope, $location, $log, $cookies, authInfo, LoginRoute, ExpertRoute, NdsLabsApi) {
      
  // Grab saved auth data from cookies and attempt to use the leftover session
  var token = $cookies.get('token');
  var namespace = $cookies.get('namespace');
  if (token && namespace) {
    // Pull our token / namespace from cookies
    authInfo.get().token = token;
    authInfo.get().namespace = namespace;
  }
      
  var HomeRoute = ExpertRoute;
  
  // TODO: Investigate performance concerns here...
  $rootScope._ = window._;
  $rootScope.google = window.google;
  
  // When we change routes, check that we are still authed
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    // Define the logic for
    var terminateSession = function() {
      // user needs to log in, redirect to /login
      if (next.templateUrl !== "/app/login/login.html") {
        authInfo.get().token = null;
        $cookies.remove('token');
        $cookies.remove('namespace');
        $location.path(LoginRoute);
      }
    };
    
    // Check if our token is still valid
    var token = $cookies.get('token');
    if (token) {
      authInfo.get().token = token;
      authInfo.get().namespace = $cookies.get('namespace');
      NdsLabsApi.getRefresh_token().then(function() {
        $log.debug('Token refreshed: ' + authInfo.get().token);
        $location.path(HomeRoute);
      }, function() {
        $log.debug('Failed to refresh token!');
        
        // TODO: Allow login page to reroute user to destination?
        // XXX: This would matter more if there are multiple views
        //authInfo.returnRoute = next.$$route.originalPath;
        
        terminateSession();
      });
    } else {
      terminateSession();
    }
  });
}]);
