/* global angular:false */

angular
.module('navbar', [])
/**
 * A simple filter to select only left-aligned or right-aligned navbar links
 */
.filter('navbar', function() {
  return function(input, pull) {
    var filtered = [];
    
    angular.forEach(input, function(nav) {
      if (pull === 'right' && nav.right === true) {
        filtered.push(nav);
      } else if (pull === 'left' && !nav.right) {
        filtered.push(nav);
      }
    });
    return filtered;
  };
})
/**
 * The Controller for the Navigation Bar
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('NavbarController', [ '$scope', '$location', 'LoginRoute', 'AppStoreRoute', 'HomeRoute', 'DEBUG', 'Layout',
    function($scope, $location, LoginRoute, AppStoreRoute, HomeRoute, DEBUG, Layout) {
  $scope.layout = Layout;    
      
  $scope.$on('$routeChangeSuccess', function(event, current, previous){
    if (current.$$route) {
      $scope.path = current.$$route.originalPath;
    }
  });

  $scope.DEBUG = DEBUG;

  // TODO: This is probably horrible, performance-wise
  $scope.isArray = angular.isArray;
  
  $scope.home = 
  {
    name:'NDS Labs',
    url: 'http://labsportal.nationaldataservice.org/'
  };
  
  $scope.navs = [
    {
      name: 'Dashboard',
      url: '#' + HomeRoute,
      icon: 'fa-dashboard'
    },
    {
      name:'Browse Applications',
      url: '#' + AppStoreRoute,
      icon: 'fa-list-alt'
    }
  ];
}]);
