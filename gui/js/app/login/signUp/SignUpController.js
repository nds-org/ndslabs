/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Sign-Up" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SignUpController', [ '$scope', '$uibModalInstance', '$log', 'NdsLabsApi', function($scope, $uibModalInstance, $log, NdsLabsApi) {
  $scope.newProject = {
    name: '',
    description: '',
    namespace: '',
    password: '',
    passwordConfirmation: ''
  };
  
  $scope.ok = function(project) {
    NdsLabsApi.postRegister({ 'account': project }).then(function(data, xhr) {
      $uibModalInstance.close(data);
    }, function(headers) {
      $log.error('Failed to create account: ' + project.namespace);
    });
  };
  
  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };
}]);
