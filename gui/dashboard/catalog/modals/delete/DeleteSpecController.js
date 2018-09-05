/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Delete Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('DeleteSpecCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'NdsLabsApi', 'Specs', 'Stacks', 'spec',
    function($scope, $log, $uibModalInstance, _, NdsLabsApi, Specs, Stacks, spec) {
  "use strict";
  
  $scope.spec = spec;
  $scope.showAlert = _.find(Stacks.all, [ 'key', $scope.spec.key ]);
  angular.forEach(Stacks.all, function(stack) {
    if (_.find(stack.services, [ 'service', $scope.spec.key ])) {
      $scope.showAlert = true;
    }
  });

  $scope.delete  = function() {
    NdsLabsApi.deleteServicesByServiceId({ 'serviceId': $scope.spec.key }).then(function() {
      Specs.populate().then(function() {
        $uibModalInstance.close();
      });
    }, function(response) {
      $scope.showAlert = response.status === 409;
    });
  };

  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };
}]);