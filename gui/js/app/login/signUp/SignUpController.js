/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Sign-Up" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SignUpController', [ '$scope', '$log', '$location', 'NdsLabsApi', 'Project', 'ProductName', 'AuthInfo', 'HomeRoute', 
    function($scope, $log, $location, NdsLabsApi, Project, ProductName, AuthInfo, HomeRoute) {
      
  if (AuthInfo.get().token) {
    $location.path(HomeRoute);
  }   
  
  $scope.productName = ProductName;
  
  $scope.newProject = Project.create();
  $scope.progressMessage = '';
  $scope.showVerify = false;
  
  $scope.ok = function(account) {
    $scope.progressMessage = 'Please wait...';
    $scope.errorMessage = '';
    
    NdsLabsApi.postRegister({ 'account': account }).then(function(data, xhr) {
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
