'use strict';


/**
 * Define our ndslabs module here. All other files will 
 * use the single-argument notation for angular.module()
 */
angular.module('ndslabs', [ 'navbar', 'footer', 'ndslabs-api', 'ngWizard', 'ngGrid', 'ngAlert', 
    'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'ui.bootstrap', 'frapontillo.gage' ])

/**
 * If true, display verbose debug data as JSON
 */ 
.constant('DEBUG', false)

/**
 *TODO: Whether or not to use mock data (false if talking to live etcd)
 */ 
//.constant('MOCKDATA', false)

/**
 * Make lodash available for injection into controllers
 */ 
.constant('_', window._)

/**
 * The route to our Login View
 */ 
.constant('LoginRoute', '/login')

/**
 * The route to our Express Setup View
 */ 
.constant('ExpressRoute', '/express')

/**
 * The route to our Expert Setup View
 */ 
.constant('ExpertRoute', '/home')

/**
 * Hostname / Port for communicating with etcd
 */ 
.constant('ApiUri', 'http://141.142.209.154:8083')

/**
 * Logic for communicating with etcd (powered by swagger-js-codegen)
 * @param {string} ApiUri - the hostname port defined above
 * @param {Object} ApiServer - the REST API client generated by swagger; see '/app/shared/NdsLabsRestApi.js'
 */ 
.factory('NdsLabsApi', [ 'ApiUri', 'ApiServer', function(ApiUri, ApiServer) {
  // TODO: Investigate options / caching
  // XXX: Caching may not be possible due to the unique token sent with every request
  return new ApiServer(ApiUri);
}])

/**
 * A shared store for our AuthInfo, done as a provider so that we
 * can easily inject it into the .config() block below
 */ 
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

/**
 * Configure routes / HTTP for our app using the services defined above
 */
.config([ '$routeProvider', '$httpProvider', 'AuthInfoProvider', 'LoginRoute', 'ExpressRoute', 'ExpertRoute',
    function($routeProvider, $httpProvider, authInfo, LoginRoute, ExpressRoute, ExpertRoute) {
  // Setup default behaviors for encountering errors
  $httpProvider.interceptors.push(['$rootScope', '$cookies', '$q', '$location', '$log', '_', 'DEBUG', 'ApiUri', 'AuthInfo',
      function (scope, $cookies, $q, $location, $log, _, DEBUG, ApiUri, AuthInfo) {
    return {
      // Attach our auth token to each outgoing request (to the api server)
      'request': function(config) {
        // If this is a request for our API server
        if (_.includes(config.url, ApiUri)) {
          if (DEBUG) {
            $log.debug('Request:');
          }
          
          // If this was *not* an attempt to authenticate
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
        // If this is a response from our API server
        if (_.includes(response.config.url, ApiUri)) {
          if (DEBUG) {
            $log.debug("Response:")
            console.debug(response);
          }
        
          // If this was in response to an /authenticate or /refresh_token request
          if ((_.includes(response.config.url, '/authenticate') && response.config.method === 'POST')
              || (_.includes(response.config.url, '/refresh_token') && response.config.method === 'GET')) {
            // This response should contain a new token, so save it as a cookie
            $cookies.put('token', response.data.token);
          }
        }
        
        return response;
      },
      'responseError': function(rejection) {
        // If this is a response from our API server
        if (_.includes(rejection.config.url, ApiUri)) {
          if (DEBUG) {
            $log.debug("Response Rejection:");
            console.debug(rejection);
          }
        
          // Read out the HTTP error code
          var status = rejection.status;
          
          // Handle HTTP 401: Not Authorized - User needs to provide credentials
          if (status == 401) {
            // TODO: If we want to intercept the route to redirect them after a successful login
            //window.location = "/account/login?redirectUrl=" + Base64.encode(document.URL);
            
            // Purge current session data
            authInfo.authInfo.token = null;
            $cookies.remove('token');
            $cookies.remove('namespace');
            
            // Route to Login Page to prompt for credentials
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
  /*
  .when(ExpressRoute, {
    controller: 'ExpressSetupController',
    templateUrl: '/app/express/expressSetup.html'
  })
  */
  .otherwise({ redirectTo: LoginRoute });
}])

/**
 * Once configured, run this section of code to finish bootstrapping our app
 */
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
  
  // Make _ bindable in partial views
  // TODO: Investigate performance concerns here...
  $rootScope._ = window._;
  
  // When user changes routes, check that they are still authed
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    // Define the logic for
    var terminateSession = function() {
      // Purge current session data
      authInfo.get().token = null;
      $cookies.remove('token');
      $cookies.remove('namespace');
        
      // user needs to log in, redirect to /login
      if (next.templateUrl !== "/app/login/login.html") {
        $location.path(LoginRoute);
      }
    };
    
    // Check if the token is still valid
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
