/* global angular:false */

angular
.module('ndslabs-login')
/**
 * The controller for our "Reset Password" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ResetPasswordController', [ '$scope', '$rootScope', '$location', '$cookies', '$routeParams', '$log', 'NdsLabsApi', 'ProductName', 'AuthInfo', 'ReturnRoute', 'CookieOptions', 
    function($scope, $rootScope, $location, $cookies, $routeParams, $log, NdsLabsApi, ProductName, AuthInfo, ReturnRoute, CookieOptions) {
  "use strict";

  $scope.token = $routeParams.t;
  
  if (!$scope.token) {
    $scope.token = $cookies.get('token', CookieOptions);
  }
  
  if ($scope.token) {
    $cookies.put('token', $scope.token, CookieOptions);
  }
  
  $rootScope.rd = '';
  if ($routeParams.rd) {
    ReturnRoute = $routeParams.rd;
    $rootScope.rd = encodeURIComponent(ReturnRoute);
  }
  
  $scope.productName = ProductName;
  
  $scope.resetSendSuccessful = false;
  $scope.resetSuccessful = false;
  
  ($scope.resetForms = function() {
    $scope.password = {
      accountId: '',
      password: '',
      confirmation: ''
    };
  })(); // jshint: ignore
  
  /**
   * Send a reset link to the e-mail associated with the given accountId 
   *    (where accountId is username/namespace or email address)
   */
  $scope.sendResetLink = function() {
    if (!$scope.password.accountId) {
      return;
    }
    
    NdsLabsApi.postReset({ userId: $scope.password.accountId }).then(function(response) {
      console.debug(response.data);
      $scope.resetSendSuccessful = true;
    }, function(response) {
      $log.error("Failed to send password reset link");
      console.debug(response);
    });
  };
  
  /**
   * Reset the password of the account associated with the token attached to the request headers
   */
  $scope.resetPassword = function() {
    if ($scope.password.password !== $scope.password.confirmation) {
      return;
    }
    
    // TODO: What is the correct API call here?
    NdsLabsApi.putChangePassword({ password: { 
      password: $scope.password.password,
    }}).then(function(response) {
      console.debug(response.data);
      $scope.resetSuccessful = true;
      $scope.resetForms();
    }, function(response) {
      $log.error("Failed to reset password");
      console.debug(response);
    });
  };
}]);
