/* global angular:false */

angular
.module('navbar', [ 'ndslabs-config' ])

/**
 * A simple filter to select only left-aligned or right-aligned navbar links
 */
.filter('navbar', function() {
  "use strict";

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
.controller('NavbarController', [ '$scope', '$rootScope', '$window', '$location', '$cookies', 'Project', 'AuthInfo', 'ProductName', 'ProductUrl', 'HelpLinks', 'FileManager', 'AutoRefresh', 'ReturnRoute', 'CookieOptions', 'SigninUrl',
    function($scope, $rootScope, $window, $location, $cookies, Project, AuthInfo, ProductName, ProductUrl, HelpLinks, FileManager, AutoRefresh, ReturnRoute, CookieOptions, SigninUrl) {
  "use strict"
  
  // Enable JS dropdowns on the navbar
  // FIXME: Is there a cleaner way to do this? Calling jQuery manually is ugly...
  $('.dropdown-toggle').dropdown();
  
  $scope.$on('$routeChangeSuccess', function(event, current, previous) {
    if (current.$$route) {
      $scope.path = current.$$route.originalPath;
    }
  });
  
  // Navbar is not a route, so we can't use $routeParams to access "rd" here
  $rootScope.rd = '';
  $scope.$watch(function() { return ReturnRoute; }, function(newValue, oldValue) { $rootScope.rd = encodeURIComponent(ReturnRoute); });
  $scope.$watch(function() { return Project.project; }, function(newValue, oldValue) { $scope.project = newValue; });
  $scope.$watch(function() { return AuthInfo.get(); }, function(newValue, oldValue) { $scope.auth = newValue; });
  
  // Grab the username / token from our Auth service
  $scope.auth = AuthInfo.get();
  
  // FIXME: Grab user's e-mail, limits, settings, etc
  // Project.populate($scope.auth.namespace);
  
  $scope.enableOAuth = SigninUrl.indexOf("/oauth2/") !== -1;
  $scope.signinLink = $scope.enableOAuth ? SigninUrl : '/login/' + ($rootScope.rd ? 'rd=' : '');
  $scope.helpLinks = HelpLinks;
  
  $scope.fileManager = FileManager;
  $scope.launchingFileManager = FileManager.busy;
  $scope.$watch('fileManager.busy', function(newValue, oldValue) {
    $scope.launchingFileManager = newValue;
    if (newValue) {
      AutoRefresh.start();
    }
  });
  
  $scope.logout = function() {
    AuthInfo.purge();
    
    AuthInfo.get().token = null;
    AuthInfo.get().namespace = null;
    
    $cookies.remove('token', CookieOptions);
    $cookies.remove('namespace', CookieOptions);
    
    // TODO: Can we avoid hard-coding this URL?
    $window.location.href = '/landing/';
  };
  
  $scope.brand = 
  {
    name: ProductName,
    url: ProductUrl
  };
}]);
