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
.controller('NavbarController', [ '$scope', '$location', 'LoginRoute', 'AppStoreRoute', 'HomeRoute', 'ProductName', 'ProductUrl', 'HelpLinks', 'FileManager', 'FileManagerBusy',
    function($scope, $location, LoginRoute, AppStoreRoute, HomeRoute, ProductName, ProductUrl, HelpLinks, FileManager, FileManagerBusy) {
  $scope.$on('$routeChangeSuccess', function(event, current, previous){
    if (current.$$route) {
      $scope.path = current.$$route.originalPath;
    }
  });
  
  $scope.helpLinks = HelpLinks;
  $scope.fileManager = FileManager;
  $scope.launchingFileManager = FileManagerBusy;
  
  $scope.brand = 
  {
    name: ProductName,
    url: ProductUrl
  };
}]);
