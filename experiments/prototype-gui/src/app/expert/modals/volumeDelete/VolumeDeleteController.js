/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Delete Volume" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
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