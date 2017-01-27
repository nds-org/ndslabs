/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for the "Console Viewer" Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
 
.controller('ConsoleController', [ '$scope', '$routeParams', '$location', '$window', '_', 'Stacks', 'AuthInfo', 'LandingRoute', 'ProductName', function($scope, $routeParams, $location, $window, _, Stacks, AuthInfo, LandingRoute, ProductName) {
  "use strict";
  
  if (!AuthInfo.get().token) {
    $location.path(LandingRoute);
    return;
  }
  
  $scope.productName = ProductName;
  
  $scope.$watch(function () { return Stacks.all; }, function() {
  
    $scope.stacks = Stacks.all;
    var stk = _.find($scope.stacks, [ 'id', $routeParams.stackId ]);
    
    if (!stk) {
      return;
    }
    
    $scope.stack = stk;
    
    
    $scope.service = _.find($scope.stack.services, [ 'service', $routeParams.service ]);
  });
    
  $scope.svcId = $routeParams.stackId + '-' + $routeParams.service;
  $window.document.title = 'Console: ' + $scope.svcId;
  
  $scope.stacks = Stacks.all;
}]);