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
  "use strict";

  $scope.stack = stack;

  $scope.ok = function() { $uibModalInstance.close(stack); };
  $scope.close = function() { $uibModalInstance.dismiss('cancel'); };
}]);