/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Sign-Up" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SignUpController', [ '$scope', '$log', '$location', '_', 'NdsLabsApi', 'Project', 'ProductName', 'AuthInfo', 'HomeRoute', 'HelpLinks',
    function($scope, $log, $location, _, NdsLabsApi, Project, ProductName, AuthInfo, HomeRoute, HelpLinks) {
  "use strict";

  if (AuthInfo.get().token) {
    $location.path(HomeRoute);
  }   
  
  $scope.forms = {};
  
  $scope.eulaLink = _.find(HelpLinks, [ 'name', 'Acceptable Use Policy' ]);
  
  $scope.productName = ProductName;
  
  $scope.newProject = Project.create();
  $scope.progressMessage = '';
  $scope.showVerify = false;
  
  $scope.signUp = function(account) {
    if (account.password !== account.passwordConfirmation) {
      return false;
    }
    
    $scope.progressMessage = 'Please wait...';
    $scope.errorMessage = '';
    
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
