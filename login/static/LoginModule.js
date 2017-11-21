/* global angular:false */

angular
.module('ndslabs-login', [ 'ngRoute', 'ngCookies', 'navbar', 'footer', 'ndslabs-services', 'ndslabs-config', 'ndslabs-api', 'angular-google-analytics',  'ui.bootstrap' ])

/**
 * Configure routes / HTTP for our app using the services defined above
 */
.config([ '$routeProvider', '$httpProvider', 'ProductName', 'GaAccount', 'AnalyticsProvider', 
    function($routeProvider, $httpProvider, ProductName, GaAccount, AnalyticsProvider) {
  "use strict";
  
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

  $routeProvider
    .when('/login', {
      title: ProductName + ' Sign-In',
      controller: 'LoginController',
      templateUrl: 'static/login.html',
      pageTrack: '/login'
    })
    .when('/register', {
      title: ProductName + ' Sign Up',
      controller: 'SignUpController',
      templateUrl: 'static/signUp/signUp.html',
      pageTrack: '/register'
    })
    .when('/recover', {
      title: ProductName + ' Password Reset',
      controller: 'ResetPasswordController',
      templateUrl: 'static/reset/reset.html',
      pageTrack: '/recover'
    })
    .otherwise('/login');
}]);
