'use strict';

angular
.module('ndslabs', [ 'navbar', 'footer', 'ngWizard', 'ngGrid', 'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'ui.bootstrap' ])
.config([ '$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  //$locationProvider.html5Mode(true);
  $routeProvider.when('/labs', {
    controller: 'NdsLabsController',
    templateUrl: '/app/ndslabs/ndslabs.html'
  })
  .otherwise({redirectTo: '/labs'});
}]);
