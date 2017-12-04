/* global angular:false */

/**
 * Define our ndslabs module here. All other files will 
 * use the single-argument notation for angular.module()
 */
angular.module('ndslabs', [ 'navbar', 'footer', 'ndslabs-services', 'ndslabs-filters', 'ndslabs-directives',  'ndslabs-api', 'ngWizard', 'ngGrid', 'ngAlert', 'ngTagsInput', 'cgBusy', 'ngSanitize',
    'ngRoute', 'ngResource', 'ngCookies', 'ngMessages', 'ui.bootstrap', 'ngPasswordStrength', 'angular-clipboard', 'ui.pwgen', 'ui.gravatar', 'angular-google-analytics' ])

.constant('DashboardAppPath', '/dashboard/#')

.constant('HomePathSuffix', '/home')
.constant('AddServicePathSuffix', '/home/:stackId/add/:service')
.constant('EditServicePathSuffix', '/home/:stackId/edit/:service')
.constant('ServiceConsolePathSuffix', '/home/:stackId/console/:service')

.constant('AppStorePathSuffix', '/store')
.constant('AddSpecPathSuffix', '/store/add')
.constant('EditSpecPathSuffix', '/store/edit/:specKey')

/**
 * Configure routes / HTTP for our app using the services defined above
 */
.config([ '$provide', '$routeProvider', '$httpProvider', '$logProvider', 'DEBUG', 'AuthInfoProvider', 'DashboardAppPath', 'AppStorePathSuffix', 'HomePathSuffix', 'ServiceConsolePathSuffix', 'AddServicePathSuffix', 'EditServicePathSuffix', 'AddSpecPathSuffix', 'EditSpecPathSuffix', 'ProductName', 'GaAccount', 'AnalyticsProvider', 'LandingRoute', 'LoginRoute', 
    function($provide, $routeProvider, $httpProvider, $logProvider, DEBUG, authInfo, DashboardAppPath, AppStorePathSuffix, HomePathSuffix, ServiceConsolePathSuffix, AddServicePathSuffix, EditServicePathSuffix, AddSpecPathSuffix, EditSpecPathSuffix, ProductName, GaAccount, AnalyticsProvider, LandingRoute, LoginRoute) {
  "use strict";

  // Squelch debug-level log messages
  $logProvider.debugEnabled(DEBUG);
  
  // Set up Google Analytics
  AnalyticsProvider.setAccount(GaAccount)
                   .useECommerce(false, false)
                   .trackPages(true)
                   .trackUrlParams(true)
  //                 .ignoreFirstPageLoad(true)
                   .readFromRoute(true)
  //                 .setDomainName(ApiUri.api)
  //                 .setHybridMobileSupport(true)
                   .useDisplayFeatures(true)
                   .useEnhancedLinkAttribution(true);
                   
  // Setup default behaviors for encountering HTTP errors
  $httpProvider.interceptors.push(['$rootScope', '$cookies', '$cookieStore', '$q', '$location', '$log', '_', 'DEBUG', 'ApiUri', 'AuthInfo', 'CookieOptions',
      function (scope, $cookies, $cookieStore, $q, $location, $log, _, DEBUG, ApiUri, AuthInfo, CookieOptions) {
    return {
      // Attach our auth token to each outgoing request (to the api server)
      'request': function(config) {
        // If this is a request for our API server
        if (_.includes(config.url, ApiUri.api)) {
          // If this was *not* an attempt to authenticate
          if (!_.includes(config.url, '/authenticate')) {
            // We need to attach our token to this request
            config.headers.Authorization = 'Bearer ' + $cookies.get('token', CookieOptions);
          }
        }
        return config;
      },
      'requestError': function(rejection) {
        if (_.includes(rejection.config.url, ApiUri.api)) {
          $log.error("Request error encountered: " + rejection.config.url);
        }
        return $q.reject(rejection);
      },
      'response': function(response) {
        // If this is a response from our API server
        if (_.includes(response.config.url, ApiUri.api)) {
          // If this was in response to an /authenticate or /refresh_token request
          if ((_.includes(response.config.url, '/authenticate') && response.config.method === 'POST') ||
              (_.includes(response.config.url, '/refresh_token') && response.config.method === 'GET')) {
            // This response should contain a new token, so save it as a cookie
            $cookies.put('token', response.data.token, CookieOptions);
          }
        }
        
        return response;
      },
      'responseError': function(rejection) {
        // If this is a response from our API server
        if (_.includes(rejection.config.url, ApiUri.api)) {
          $log.error("Response error encountered: " + rejection.config.url);
        
          // Read out the HTTP error code
          var status = rejection.status;
          
          // Handle HTTP 401: Not Authorized - User needs to provide credentials
          if (status == 401) {
            // TODO: If we want to intercept the route to redirect them after a successful login
            //window.location = "/account/login?redirectUrl=" + Base64.encode(document.URL);
            
            // Purge current session data
            AuthInfo.authInfo.token = null;
            //$cookies.remove('token', CookieOptions);
            //$cookies.remove('namespace', CookieOptions);
            $cookieStore.remove('token', CookieOptions);
            //$cookieStore.remove('namespace', CookieOptions);
            
            $log.debug("Routing to login...");
            //window.location.href = LoginRoute;
            
            return $q.reject(rejection);
          }
        }
        
        // otherwise
        return $q.reject(rejection);
      }
    };
  }]);
  
  // Set up log decorator (log forwarding)
  $provide.decorator('$log', ['$delegate', 'Logging', function($delegate, Logging) {
    Logging.enabled = true;
    var methods = {
      debug: function() {
        if (Logging.enabled) {
          // Only logging debug messages to the console
          $delegate.debug.apply($delegate, arguments);
          //Logging.debug.apply(null, arguments);
        }
      },
      error: function() {
        if (Logging.enabled) {
          $delegate.error.apply($delegate, arguments);
          Logging.error.apply(null, arguments);
        }
      },
      log: function() {
        if (Logging.enabled) {
          $delegate.log.apply($delegate, arguments);
          Logging.log.apply(null, arguments);
        }
      },
      info: function() {
        if (Logging.enabled) {
          $delegate.info.apply($delegate, arguments);
          Logging.info.apply(null, arguments);
        }
      },
      warn: function() {
        if (Logging.enabled) {
          $delegate.warn.apply($delegate, arguments);
          Logging.warn.apply(null, arguments);
        }
      }
    };
    return methods;
  }]);
      
  // Setup routes to our different pages
  $routeProvider
  .when(AppStorePathSuffix, {
    title: ProductName + ' Catalog',
    controller: 'CatalogController',
    templateUrl: 'catalog/catalog.html',
    pageTrack: DashboardAppPath + AppStorePathSuffix
  })
  .when(AddSpecPathSuffix, {
    title: 'Add Application',
    controller: 'AddOrEditSpecController',
    templateUrl: 'catalog/addOrEdit/addOrEditSpec.html',
    pageTrack: DashboardAppPath + AddSpecPathSuffix
  })
  .when(EditSpecPathSuffix, {
    title: 'Edit Application',
    controller: 'AddOrEditSpecController',
    templateUrl: 'catalog/addOrEdit/addOrEditSpec.html',
    pageTrack: DashboardAppPath + EditSpecPathSuffix
  })
  .when(HomePathSuffix, {
    title: ProductName + ' Dashboard',
    controller: 'DashboardController',
    templateUrl: 'dashboard/dashboard.html',
    pageTrack: DashboardAppPath + HomePathSuffix
  })
  .when(AddServicePathSuffix, {
    title: 'Add Application Service',
    controller: 'AddOrEditServiceController',
    templateUrl: 'dashboard/service/addOrEditService.html',
    pageTrack: DashboardAppPath + AddServicePathSuffix
  })
  .when(EditServicePathSuffix, {
    title: 'Edit Application Service',
    controller: 'AddOrEditServiceController',
    templateUrl: 'dashboard/service/addOrEditService.html',
    pageTrack: DashboardAppPath + EditServicePathSuffix
  })
  .when(ServiceConsolePathSuffix, {
    title: 'Service Console',
    controller: 'ConsoleController',
    templateUrl: 'dashboard/console/console.html',
    pageTrack: DashboardAppPath + ServiceConsolePathSuffix
  })
  // TODO: Create an ErrorRoute?
  .otherwise({ redirectTo: HomePathSuffix });
}])

/**
 * Once configured, run this section of code to finish bootstrapping our app
 */
.run([ '$rootScope', '$window', '$location', '$routeParams', '$log', '$interval', '$cookies', '$uibModalStack', 'Stacks', '_', 'AuthInfo', 'LoginRoute', 'AppStoreRoute', 'HomeRoute', 'NdsLabsApi', 'AutoRefresh', 'ServerData', 'Loading', 'LandingRoute', 'VerifyAccountRoute', 'Analytics', 'CookieOptions',
    function($rootScope, $window, $location, $routeParams, $log, $interval, $cookies, $uibModalStack, Stacks, _, authInfo, LoginRoute, AppStoreRoute, HomeRoute, NdsLabsApi, AutoRefresh, ServerData, Loading, LandingRoute, VerifyAccountRoute, Analytics, CookieOptions) {
  "use strict";

  // Make _ bindable in partial views
  // TODO: Investigate performance concerns here...
  $rootScope._ = window._;
    
  // Check our token every 60s
  var tokenCheckMs = 60000;
  
  // Define the logic for ending a user's session in the browser
  var authInterval = null;
  var terminateSession = authInfo.purge = function() {
    // Cancel the auth check interval
    if (authInterval) {
      $interval.cancel(authInterval);
      authInfo.tokenInterval = authInterval = null;
    }
    
    if (authInfo.get().token) {
      // Purge current session data
      authInfo.get().token = null;
      $cookies.remove('token', CookieOptions);
      $cookies.remove('namespace', CookieOptions);
      
      // Close any open modals
      $uibModalStack.dismissAll();
      
      // Stop any running auto-refresh interval
      AutoRefresh.stop();
      
      // Purge any server data
      ServerData.purgeAll();
      
      $log.debug("Terminating session... routing to Landing");
      
      if ($routeParams.t) {
        // Remove any token from query string
        $location.search('t', null);
      }
      
      // redirect user to landing page
      //$location.path();
      //window.location.href = LoginRoute;
    }
  };
  
  // Grab saved auth data from cookies and attempt to use the leftover session
  var token = $cookies.get('token', CookieOptions);
  var namespace = $cookies.get('namespace', CookieOptions);
  
  console.log(`Found token for namespace ${namespace}:`, token);
  var path = $location.path();
  if (token && namespace) {
    // Pull our token / namespace from cookies
    authInfo.get().token = token;
    authInfo.get().namespace = namespace;
  } else {
    $log.debug("App started with no token... routing to Login");
    //window.location.href = LoginRoute;
    return;
  }
  
  // Every so often, check that our token is still valid
  var checkToken = function() {
    NdsLabsApi.getCheck_token().then(function() { $log.debug('Token is still valid.'); }, function() {
      $log.error('Token expired, redirecting to login.');
      terminateSession();
    });
  };
  
  // Change the tab/window title when we change routes
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
    if (current.$$route) {
      $window.document.title = current.$$route.title;
    } else {
      $log.error('Encountered undefined route...');
    }
  });
  
  // When user changes routes, check that they are still authed
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    // Skip token checking for the "Verify Account" View
    if (next.$$route && 
        next.$$route.templateUrl === 'app/login/verify/verify.html' ||
        next.$$route.templateUrl === 'app/landing/landing.html' ||
        next.$$route.templateUrl === 'app/help/help.html' ||
        next.$$route.templateUrl === 'app/login/reset/reset.html' ||
        next.$$route.templateUrl === 'app/login/login.html') {
      return;
    }
  
    // Check if the token is still valid on route changes
    var token = $cookies.get('token', CookieOptions);
    if (token) {
      authInfo.get().token = token;
      authInfo.get().namespace = $cookies.get('namespace', CookieOptions);
      NdsLabsApi.getRefresh_token().then(function() {
        $log.debug('Token refreshed: ' + authInfo.get().token);
        Loading.set(ServerData.populateAll(authInfo.get().namespace));
        
        // Restart our token check interval
        if (authInterval) {
          $interval.cancel(authInterval);
          authInterval = null;
        }
        authInfo.tokenInterval = authInterval = $interval(checkToken, tokenCheckMs);
        
      }, function() {
        $log.debug('Failed to refresh token!');
        
        // TODO: Allow login page to reroute user to destination?
        // XXX: This would matter more if there are multiple views
        //authInfo.returnRoute = next.$$route.originalPath;
        
        terminateSession();
      });
    }
  });
  
  checkToken();
}]);
