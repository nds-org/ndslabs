/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Delete Stack" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('StackDeleteCtrl', [ '$scope', '$log', '$uibModalInstance',
    function($scope, $log, $uibModalInstance) {
  "use strict";

  $scope.ok = function() { $uibModalInstance.close(); };
  $scope.close = function() { $uibModalInstance.dismiss('cancel'); };
}]);