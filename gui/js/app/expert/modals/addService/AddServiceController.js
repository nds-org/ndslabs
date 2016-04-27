/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Add Service" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddServiceCtrl', [ '$scope', '$log', '$filter', '$uibModalInstance', '_', 'StackService', 'Wizard', 'WizardPage', 'ServiceDiscovery', 'Project', 'Volumes', 'Specs', 'stack', 'service', 
    function($scope, $log, $filter, $uibModalInstance, _, StackService, Wizard, WizardPage, ServiceDiscovery, Project, Volumes, Specs, stack, service) {
  
  // Storage quota accounting
  $scope.availableSpace = ($scope.storageQuota = Project.project.storageQuota)
      - ($scope.usedSpace = $filter('usedStorage')($scope.configuredVolumes = Volumes.all));
  
  // Populate its Configuration requirements
  $scope.extraConfig = ServiceDiscovery.discoverConfigSingle(service.key);
      
  // Populate its Volume requirements and options
  $scope.volume = ServiceDiscovery.discoverRequiredSingle(stack, service.key);
  $scope.newStackOrphanedVolumes = ServiceDiscovery.discoverOrphansSingle(service.key);
  
  if ($scope.volume) {
    $scope.newStackVolumeRequirements = [ $scope.volume ];
  }
  
  // TODO: Where is this email address going to live?
  var adminEmail = 'site-admin';
  var subject = $filter('urlEncode')('Increasing My Storage Quota');
  var body = $filter('urlEncode')('Hello, Admin! I appear to have reach my storage limit of '
              + $scope.storageQuota + ' GB on ' + Project.project.namespace 
              + '. Could we please discuss options for increasing the ' 
              + 'storage quota of this project? Thank you! --' + Project.project.namespace);
  $scope.mailToLink = 'mailto:' + adminEmail 
                    + '?subject=' + subject
                    + '&body=' + body;
 
  $scope.ok = function() {
    $log.debug("Closing modal with success!");
    
    // Accumulate config name-value pairs
    var config = {};
    angular.forEach($scope.extraConfig[service.key].list, function(cfg) {
      config[cfg.name] = cfg.value;
    });
    
    $uibModalInstance.close({
      'spec': _.find(Specs.all, [ 'key', service.key ]),
      'config': config,
      'volumes': $scope.newStackVolumeRequirements || [] 
    });
  };
  
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);