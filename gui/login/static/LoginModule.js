/* global angular:false */

angular
.module('ndslabs-login', [ 'ngRoute', 'ngCookies', 'ngMessages', 'navbar', 'footer', 'ndslabs-services', 'ndslabs-config', 'ndslabs-api', 'angular-google-analytics',  'ui.bootstrap' ])

.constant('LoginAppPath', '/login/#')
.constant('SigninPathSuffix', '/')
.constant('SignupPathSuffix', '/register')
.constant('RecoveryPathSuffix', '/recovery')

/**
 * Configure routes / HTTP for our app using the services defined above
 */
.config([ '$routeProvider', '$httpProvider', 'ProductName', 'GaAccount', 'AnalyticsProvider', 'LoginAppPath', 'SigninPathSuffix', 'SignupPathSuffix', 'RecoveryPathSuffix',
    function($routeProvider, $httpProvider, ProductName, GaAccount, AnalyticsProvider, LoginAppPath, SigninPathSuffix, SignupPathSuffix, RecoveryPathSuffix) {
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
    .when(SigninPathSuffix, {
      title: ProductName + ' Sign-In',
      controller: 'LoginController',
      templateUrl: 'static/login.html',
      reloadOnSearch: false,
      pageTrack: LoginAppPath + SigninPathSuffix
    })
    .when(SignupPathSuffix, {
      title: ProductName + ' Sign Up',
      controller: 'SignUpController',
      templateUrl: 'static/signUp/signUp.html',
      reloadOnSearch: false,
      pageTrack: LoginAppPath + SignupPathSuffix
    })
    .when(RecoveryPathSuffix, {
      title: ProductName + ' Password Reset',
      controller: 'ResetPasswordController',
      templateUrl: 'static/reset/reset.html',
      reloadOnSearch: false,
      pageTrack: LoginAppPath + RecoveryPathSuffix
    })
    .otherwise(SigninPathSuffix);
}]);
