/* global angular:false */

angular
.module('ndslabs-config', [])

/**
 * If true, display verbose debug data as JSON
 */ 
.constant('DEBUG', false)

/**
 * Account number for Google Analytics tracking
 */
.constant('GaAccount', '')

/**
 *TODO: Whether or not to use mock data (false if talking to live etcd)
 */ 
//.constant('MOCKDATA', false)

/**
 * Make lodash available for injection into controllers
 */
.constant('_', window._)

/**
 * The route to our "Landing Page" View
 */
.constant('LandingRoute', '/')

/**
 * The route to our "Login" View
 */
.constant('LoginRoute', '/login')

/**
 * The route to the "Contact Us" view
 */
.constant('ContactUsRoute', '/contact')

/**
 * The route to our "Request Access" View
 */
.constant('SignUpRoute', '/register')

/**
 * The route to our "Verify Account" View
 */
.constant('VerifyAccountRoute', '/register/verify')

/**
 * The route to our "Recover Password" View
 */
.constant('ResetPasswordRoute', '/recover')

/**
 * The route to the "AppStore" view
 */
.constant('AppStoreRoute', '/store')

/**
 * The route to the "Add Application Spec" view
 */
.constant('AddSpecRoute', '/store/add')

/**
 * The route to the "Edit Application Spec" view
 */
.constant('EditSpecRoute', '/store/edit/:specKey')

/**
 * The route to our "Dashboard" View
 */
.constant('HomeRoute', '/home')

/**
 * The route to the "Add Application Service" view
 */
.constant('AddServiceRoute', '/home/:stackId/add/:service')

/**
 * The route to the "Edit Application Service" view
 */
.constant('EditServiceRoute', '/home/:stackId/edit/:service')

/**
 * The route to the "Application Service Console" view
 */
.constant('ConsoleRoute', '/home/:stackId/console/:service')

/**
 * The back-up (default) administrator e-mail to use for support, 
 * in case the /api/contact endpoint is unavailable
 */
.constant('SupportEmail', 'lambert8@illinois.edu')

/**
 * The name of the product to display in the UI and the URL to link to when clicked
 */
 
.constant('OrgName', 'NDS')
.constant('ProductName', 'Labs Workbench')
.constant('ProductUrl', 'http://www.nationaldataservice.org/projects/labs.html')

.value('HelpLinks', [
  { name: "Feature Overview",       icon: 'fa-info-circle',        url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Feature+Overview' },
  { name: "F.A.Q.",                 icon: 'fa-question-circle',    url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Frequently+Asked+Questions'},
  { name: "User's Guide",           icon: 'fa-book',               url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/User%27s+Guide' },
  { name: "Developer's Guide",      icon: 'fa-code-fork',          url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Developer%27s+Guide' },
  { name: "Acceptable Use Policy",  icon: 'fa-gavel',              url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy' },
])

/**
 * The version/revision of this GUI
 */
.constant('BuildVersion', '1.0.13-devel')
.constant('BuildDate', '')

/**
 * Hostname / Port for communicating with etcd
 * 
 * This must be the external IP and nodePort (when running in k8)
 * 
 * TODO: We assume this is running on the same machine as the apiserver.
 */ 
.constant('ApiHost', 'www.mldev.ndslabs.org')
.constant('ApiPort', '')
.constant('ApiPath', '/api')
.constant('ApiSecure', true) 

.constant('WebsocketPath', '/console')

/** Store our built ApiUri here */
.value('ApiUri', { api: '', ws: '' })

.config([ '$provide', '$routeProvider', '$httpProvider', '$logProvider', 'DEBUG', 'AuthInfoProvider', 'LoginRoute', 'AppStoreRoute', 'HomeRoute', 'ConsoleRoute', 'AddServiceRoute', 'EditServiceRoute', 'AddSpecRoute', 'EditSpecRoute', 'VerifyAccountRoute', 'ResetPasswordRoute', 'SignUpRoute', 'ContactUsRoute', 'ProductName', 'LandingRoute', 'GaAccount', 'AnalyticsProvider', 
    function($provide, $routeProvider, $httpProvider, $logProvider, DEBUG, authInfo, LoginRoute, AppStoreRoute, HomeRoute, ConsoleRoute, AddServiceRoute, EditServiceRoute, AddSpecRoute, EditSpecRoute, VerifyAccountRoute, ResetPasswordRoute, SignUpRoute, ContactUsRoute, ProductName, LandingRoute, GaAccount, AnalyticsProvider) {

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
      
  $routeProvider
  .when(LandingRoute, {
    title: ProductName + ' Landing Page',
    controller: 'LandingController',
    templateUrl: 'app/landing/landing.html',
    pageTrack: '/'
  })
}]);
