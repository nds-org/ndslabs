/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Export Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ExportSpecCtrl', [ '$scope', '$log', '$uibModalInstance', 'clipboard', 'spec',
    function($scope, $log, $uibModalInstance, clipboard, spec) {
  $scope.spec = spec;

  $scope.copy = function() {
    if (!clipboard.supported) {
      console.log('Sorry, copy to clipboard is not supported');
      return;
    }
    
    var specCopy = angular.copy($scope.spec);
    
    // Remove unnecessary fields
    delete specCopy.$$hashKey;
    delete specCopy.updateTime;
    delete specCopy.createdTime;
    
    console.log('Copying!');
    clipboard.copyText(JSON.stringify(specCopy));
    console.log('Copied!');
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);