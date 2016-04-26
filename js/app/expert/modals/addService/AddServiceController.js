/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Add Service" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddServiceCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'ServiceDiscovery', 'Project', 'Specs', 'stack', 'service', 
    function($scope, $log, $uibModalInstance, _, ServiceDiscovery, Project, Specs, stack, service) {
  var wrapper = { 
    services: [ service ]
  };
      
  // Volumes
  $scope.storageQuota = Project.project.storageQuota;
  $scope.newStackVolumeRequirements = ServiceDiscovery.discoverRequiredVolumes(wrapper);
  $scope.newStackOrphanedVolumes = ServiceDiscovery.discoverOrphanVolumes(wrapper);
  
  // Configuration
  $scope.extraConfig = ServiceDiscovery.discoverConfigRequirements(wrapper);
  
  $scope.ok = function(service) {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(service);
  };
  
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);