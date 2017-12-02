/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Clone Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('CloneSpecCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'NdsLabsApi', 'Specs', 'spec',
    function($scope, $log, $uibModalInstance, _, NdsLabsApi, Specs, spec) {
  "use strict";
  
  $scope.$watch('spec.key', function(newValue, oldValue) {
    if (!newValue) {
      $scope.nameIsValid = false;
    }
    $scope.nameIsValid = !_.find(Specs.all, [ 'key', $scope.spec.key ]);
  });
  
  $scope.spec = angular.copy(spec);

  $scope.clone = function() {
    $log.debug("Closing modal with success!");
    
    NdsLabsApi.postServices({ 'service': $scope.spec }).then(function() {
      Specs.populate().then(function() {
        $uibModalInstance.close();
      });
    });
  };

  $scope.cancel = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);