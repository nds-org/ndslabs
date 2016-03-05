angular
.module('ndslabs')
.controller('VolumeDeleteCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'volume',
    function($scope, $log, $uibModalInstance, _, volume) {
  $scope.volume = volume;

  $scope.ok = function() {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(volume);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);