/* global angular:false */

/**
 * Define our ndslabs module here. All other files will 
 * use the single-argument notation for angular.module()
 */
angular.module('ndslabs', [ 'navbar', 'footer', 'ndslabs-services', 'ndslabs-filters', 'ndslabs-directives',  'ndslabs-api', 'ngGrid', 'ngTagsInput', 'cgBusy', 
    'ngRoute', 'ngCookies', 'ngMessages', 'ui.bootstrap', 'ngPasswordStrength', 'angular-clipboard', 'ui.pwgen', 'ui.gravatar', 'angular-google-analytics' ])

/**
 * Configure routes / HTTP for our app
 */
.config([ '$provide', '$routeProvider', '$httpProvider', '$logProvider', 'DEBUG', 'AuthInfoProvider', 'DashboardAppPath', 'AppStorePathSuffix', 'HomePathSuffix', 'ServiceConsolePathSuffix', 'AddServicePathSuffix', 'EditServicePathSuffix', 'AddSpecPathSuffix', 'EditSpecPathSuffix', 'ProductName', 'GaAccount', 'AnalyticsProvider', 
    function($provide, $routeProvider, $httpProvider, $logProvider, DEBUG, authInfo, DashboardAppPath, AppStorePathSuffix, HomePathSuffix, ServiceConsolePathSuffix, AddServicePathSuffix, EditServicePathSuffix, AddSpecPathSuffix, EditSpecPathSuffix, ProductName, GaAccount, AnalyticsProvider) {
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
.run([ '$rootScope', '$window', '$location', '$routeParams', '$log', '$interval', '$cookies', '$uibModalStack', 'Stacks', '_', 'AuthInfo', 'NdsLabsApi', 'AutoRefresh', 'ServerData', 'Loading', 'Analytics', 'CookieOptions', 'LoginAppPath',
    function($rootScope, $window, $location, $routeParams, $log, $interval, $cookies, $uibModalStack, Stacks, _, authInfo, NdsLabsApi, AutoRefresh, ServerData, Loading, Analytics, CookieOptions, LoginAppPath) {
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
    }
    
    window.location.href = '/landing/';
  };
  
  $log.debug('Starting token checker...');
  
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
    }
  });
  
  // When user changes routes, check that they are still authed
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
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
