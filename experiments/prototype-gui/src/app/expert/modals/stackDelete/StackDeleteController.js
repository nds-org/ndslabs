angular
.module('ndslabs')
/**
 * The Controller for our "Delete Stack" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('StackDeleteCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'stack', 'Volumes',
    function($scope, $log, $uibModalInstance, _, stack, Volumes) {
  $scope.stack = stack;
  
  $scope.affectedVolumes = [];
  angular.forEach(stack.services, function(service) {
    angular.forEach(Volumes.all, function(volume) {
      if (volume.attached === service.id) {
        $scope.affectedVolumes.push(volume);
      }
    });
  });

  $scope.ok = function(removeVolumes) {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(removeVolumes);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);