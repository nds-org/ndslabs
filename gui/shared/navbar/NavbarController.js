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
.controller('NavbarController', [ '$scope', '$rootScope', '$window', '$http', '$location', '$cookies', 'Project', 'AuthInfo', 'ProductName', 'ProductBrandLogoPath', 'ProductUrl', 'HelpLinks', 'FileManager', 'AutoRefresh', 'ReturnRoute', 'CookieOptions', 'SigninUrl', 'AdvancedFeatures',
    function($scope, $rootScope, $window, $http, $location, $cookies, Project, AuthInfo, ProductName, ProductBrandLogoPath, ProductUrl, HelpLinks, FileManager, AutoRefresh, ReturnRoute, CookieOptions, SigninUrl, AdvancedFeatures) {
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
  
  $scope.showFileManager = AdvancedFeatures.showFileManager;
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
    if ($scope.enableOAuth) {
      $window.location.href = '/oauth2/sign_out'; // '/login/' + ($rootScope.rd ? 'rd=' : '');
    } else {
      $window.location.href = '/landing/';
    }
  };
  
  $http.get('/env.json').then(function(response) {
      var envData = response.data;
      console.log("Env: ", envData);
      $scope.helpLinks = envData.product.helpLinks;  // formerly: HelpLinks;
      $scope.brand = {
        logo: envData.product.brandLogoPath,
        name: envData.product.name,
        url: envData.product.learnMoreUrl
      };
  });

}]);
