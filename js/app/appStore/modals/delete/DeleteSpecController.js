/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Delete Spec" Confirmation Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('DeleteSpecCtrl', [ '$scope', '$log', '$uibModalInstance', 'NdsLabsApi', 'Specs', 'spec',
    function($scope, $log, $uibModalInstance, NdsLabsApi, Specs, spec) {
  $scope.spec = spec;

  $scope.delete  = function() {
    $log.debug("Closing modal with success!");
    
    NdsLabsApi.deleteServicesByServiceId({ 'serviceId': $scope.spec.key }).then(function() {
      Specs.populate().then(function() {
        $uibModalInstance.close();
      });
    });
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);