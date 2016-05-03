/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Stop Stack" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('StackStopCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'stack',
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