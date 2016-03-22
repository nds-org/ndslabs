/* global angular:false */

angular
.module('ndslabs')
.controller('SignUpController', [ '$scope', '$uibModalInstance', '$log', 'NdsLabsApi', function($scope, $uibModalInstance, $log, NdsLabsApi) {
  $scope.newProject = {
    name: '',
    description: '',
    namespace: '',
    password: '',
    passwordConfirmation: '',
  };
  
  // Check username availability when user changes input
  //
  // FIXME: This won't work unless we're logged in, 
  //   but there is no need to sign-up if we're logged in...
  $scope.$watch('newProject.namespace', function(oldValue, newValue) {
    $scope.namespaceExists = null;
    NdsLabsApi.getProjectsByProjectId({ 'projectId': newValue }).then(function() {
      $scope.namespaceExists = true;
    }, function() {
      $scope.namespaceExists = false;
    });
  });
  
  $scope.ok = function(project) {
    if ($scope.validate(project)) {
      NdsLabsApi.postRegister({ 'project': project }).then(function(data, xhr) {
        $uibModalInstance.close(data);
      }, function(headers) {
        $log.error('Failed to create account: ' + project.namespace);
      });
      
    }
  };
  
  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };
}]);
