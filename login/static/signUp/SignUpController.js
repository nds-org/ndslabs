/* global angular:false */

angular
.module('ndslabs-login')
/**
 * The controller for our "Sign-Up" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SignUpController', [ '$scope', '$window', '$log', '$rootScope', '$routeParams', '$location', '_', 'NdsLabsApi', 'Project', 'ProductName', 'AuthInfo', 'HelpLinks', 'ReturnRoute', 'SigninUrl',
    function($scope, $window, $log, $rootScope, $routeParams, $location, _, NdsLabsApi, Project, ProductName, AuthInfo, HelpLinks, ReturnRoute, SigninUrl) {
  "use strict";

  $rootScope.rd = '';
  if ($routeParams.rd) {
    ReturnRoute = $routeParams.rd;
    $rootScope.rd = encodeURIComponent(ReturnRoute);
  }
  
  $scope.forms = {};
  
  $scope.eulaLink = _.find(HelpLinks, [ 'name', 'Acceptable Use Policy' ]);
  
  $scope.productName = ProductName;
  
  $scope.newProject = Project.create();
  $scope.progressMessage = '';
  $scope.showVerify = false;
  
  $scope.enableOAuth = SigninUrl.indexOf("/oauth2/") !== -1;
  $scope.signinLink = $scope.enableOAuth ? SigninUrl : '/login/' + ($rootScope.rd ? 'rd=' : '');
  
  // User should not be here if OAuth is enabled...
  // Navigate them to the correct place
  if ($scope.enableOAuth) {
    $window.location.href = $scope.signinLink;
    return;
  };
  
  // To handle special characters in passwords, we must escape them in the validation regex pattern
  // See https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
  $scope.escapeRegex = function(pattern) {
    if (!pattern) {
      return '';
    }
    
    return pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
  
  $scope.signUp = function(account) {
    if (account.password !== account.passwordConfirmation) {
      return false;
    }
    
    $scope.progressMessage = 'Please wait...';
    $scope.errorMessage = '';
    
    // If "rd" querystring parameter is present, pass this along as the "nexturl"
    if ($routeParams.rd) {
      account.nexturl = $routeParams.rd;
    }
    
    return NdsLabsApi.postRegister({ 'account': account }).then(function(data, xhr) {
      $scope.errorMessage = '';
      $scope.showVerify = true;
    }, function(response) {
      $log.error('Failed to create account: ' + account.namespace);
      $scope.errorMessage = response.body.Error || 'Username or e-mail address already in use';
    }).finally(function() {
      $scope.progressMessage = '';
    });
  };
}]);
