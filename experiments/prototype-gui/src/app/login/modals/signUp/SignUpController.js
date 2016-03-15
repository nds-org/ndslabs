angular
.module('ndslabs')
.controller('SignUpController', [ '$scope', '$uibModalInstance', '$log', 'NdsLabsApi', function($scope, $uibModalInstance, $log, api) {
  $scope.newProject = {
    name: '',
    description: '',
    namespace: '',
    password: '',
    passwordConfirmation: '',
  };
  
  $scope.validate = function(project) {
    if (project.namespace === '' || project.password === '') {
      return false;
    } else if (project.password !== project.passwordConfirmation) {
      return false;
    }
    
    return true;
  };
  
  $scope.ok = function(project) {
    if ($scope.validate(project)) {
      api.postProjects({ 'project': project }).then(function(data, xhr) {
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