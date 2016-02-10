'use strict';

angular
.module('test', [ 'ngRoute', 'ngResource', 'ngAnimate', 'ui.bootstrap' ])
.config([ '$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  //$locationProvider.html5Mode(true);
  $routeProvider.when('/labs', {
    controller: 'TestController',
    templateUrl: '/app/shared/test.html'
  })
  .otherwise({redirectTo: '/labs'});
}])
.run([ 'appConfig', function(appConfig) {
  appConfig.title = 'bodom0015.game-server.cc';
}]);
