/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Import Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ImportSpecCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'NdsLabsApi', 'Specs',
    function($scope, $log, $uibModalInstance, _, NdsLabsApi, Specs) {
  "use strict";
  
  $scope.json = '';
  
  $scope.$watch('json', function(newValue, oldValue) {
    try {
      $scope.spec = JSON.parse(newValue);
      $scope.validJson = true;
      $scope.keyPresent = $scope.spec.key;
      $scope.validKey = /^[a-z0-9]+$/.test($scope.spec.key);
      $scope.keyUnique = !_.find(Specs.all, [ 'key', $scope.spec.key ]);
    } catch (e) {
      $scope.validJson = false;
      
      // Hide these other validation messages for now
      $scope.keyUnique = $scope.validKey = $scope.keyPresent = true;
    }
  });

  $scope.import  = function() {
    $log.debug("Closing modal with success!");
    
    /* TODO: Other validation? */
    
    NdsLabsApi.postServices({ 'service': $scope.spec }).then(function() {
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