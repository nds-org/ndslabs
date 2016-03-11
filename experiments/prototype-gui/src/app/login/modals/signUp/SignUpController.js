angular
.module('ndslabs')
.controller('SignUpController', [ '$scope', '$log', '$uibModalInstance', 'NdsLabsApi', function($scope, $log, $uibModalInstance, api) {
  $scope.newProject = {
    name: '',
    description: '',
    namespace: '',
    password: '',
    passwordConfirmation: '',
  };
  
  $scope.validate = function(project) {
    if (project )
    if (project.password !== project.passwordConfirmation) {
      return false;
    }
    
    return true;
  };
  
  $scope.ok = function(project) {
    if ($scope.validate(project)) {
      api.postProjects({ 'project': project }).then(function(data, xhr) {
        $uibModalInstance.close(data);
      }, function(headers) {
        $log.error('Failed to create project: ' + project.namespace);
      });
      
    }
  };
  
  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };
}]);