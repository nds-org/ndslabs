angular
.module('ndslabs')
.controller('StackDeleteCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'stack',
    function($scope, $log, $uibModalInstance, _, stack) {
  $scope.stack = stack;

  $scope.ok = function() {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(stack);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);