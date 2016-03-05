angular
.module('ndslabs')
.controller('LogViewerCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'serviceLog', 'service',
    function($scope, $log, $uibModalInstance, _, serviceLog, service) {
  $scope.serviceLog = serviceLog;
  $scope.service = service;

  $scope.ok = function() {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(serviceLog);
  };
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);