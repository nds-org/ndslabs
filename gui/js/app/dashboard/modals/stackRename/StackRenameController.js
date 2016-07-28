/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Rename Stack" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('StackRenameCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'NdsLabsApi', 'Stacks', 'stack',
    function($scope, $log, $uibModalInstance, _, NdsLabsApi, Stacks, stack) {
  $scope.stack = angular.copy(stack);

  $scope.confirm = function() {
    NdsLabsApi.putStacksByStackId({ 'stack': $scope.stack, 'stackId': $scope.stack.id }).then(function() {
      Stacks.populate().then(function() {
        $uibModalInstance.close();
      });
    });
  };

  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };
}]);