/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Log Viewer" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddServiceCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'ServiceDiscovery', 'stack', 'service', 
    function($scope, $log, $uibModalInstance, _, ServiceDiscovery, stack, service) {
  // Configuration
  $scope.extraConfigs = ServiceDiscovery.discoverConfigRequirements(stack, service);
  
  // Volumes
  $scope.newStackVolumeRequirements = ServiceDiscovery.discoverRequiredVolumes(stack, service);
  $scope.newStackOrphanedVolumes = ServiceDiscovery.discoverOrphanVolumes(stack, service);
  
  $scope.ok = function(removeVolumes) {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(removeVolumes);
  };
  
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);