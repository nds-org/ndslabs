/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Reset Password" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ResetPasswordController', [ '$scope', '$location', '$cookies', '$routeParams', '$log', 'HomeRoute', 'LandingRoute', 'NdsLabsApi', 'ProductName', 'AuthInfo', function($scope, $location, $cookies, $routeParams, $log, HomeRoute, LandingRoute, NdsLabsApi, ProductName, AuthInfo) {
  "use strict";

  $scope.token = $routeParams.t;
  
  if ($scope.token) {
    $cookies.put('token', $scope.token);
  }
  
  $scope.productName = ProductName;
  
  $scope.resetSendSuccessful = false;
  $scope.resetSuccessful = false;
  
  $scope.password = {
    accountId: '',
    password: '',
    confirmation: ''
  };
  
  
  /**
   * Send a reset link to the e-mail associated with the given accountId (username / namespace)
   */
  $scope.sendResetLink = function() {
    if (!$scope.password.accountId) {
      return;
    }
    
    NdsLabsApi.postResetByAccountId({ accountId: $scope.password.accountId }).then(function(data) {
      console.debug(data);
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
    }}).then(function(data) {
      console.debug(data);
      $scope.resetSuccessful = true;
    }, function(response) {
      $log.error("Failed to reset password");
      console.debug(response);
    });
  };
}]);
