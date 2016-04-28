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
  $scope.key = service.key;
  $scope.spec = _.find(Specs.all, [ 'key', service.key ]);
  
  $scope.forms = {};
  
  // Populate its Configuration requirements / options
  $scope.config = Object.freeze(angular.copy($scope.spec.config));
  $scope.required = angular.copy($scope.config);
  $scope.options = _.remove($scope.required, function(cfg) { return cfg.canOverride && cfg.value; });
  
  /** Our overridden optional configs */
  $scope.optional = [];
  
  /** "Adds" a new override (specify custom config values) */
  $scope.overrideConfig = function(option) { $scope.optional.push(angular.copy(option)); };
  
  /** "Removes" a config override (i.e. use its default value) */
  $scope.useDefaultValue = function(cfg) { $scope.optional.splice($scope.optional.indexOf(cfg), 1); };
  
  // Rewrite data when size changes
  $scope.$watch('volume.size', function(newVal, oldVal) {
    $scope.data = [ $scope.usedSpace, $scope.availableSpace - newVal, newVal ];
  });
  
  $scope.$watch('volume.id', function(newVal, oldVal) {
    if (newVal) {
      $scope.data = [ $scope.usedSpace, $scope.availableSpace, 0 ];
    } else {
      $scope.data = [ $scope.usedSpace, $scope.availableSpace - $scope.volume.size, $scope.volume.size ];
    }
  });
      
  // Populate its Volume requirements and options
  $scope.volume = ServiceDiscovery.discoverRequiredSingle(stack, service.key);
  $scope.newStackOrphanedVolumes = ServiceDiscovery.discoverOrphansSingle(service.key);
  
  // Storage quota accounting
  $scope.storageQuota = Project.project.storageQuota;
  $scope.configuredVolumes = Volumes.all;
  $scope.usedSpace = $filter('usedStorage')($scope.configuredVolumes);
  $scope.availableSpace = $scope.storageQuota - $scope.usedSpace;
      
  $scope.labels = [ "Used Space", "Free Space", "New Volume" ];
  $scope.data = [ $scope.usedSpace, $scope.availableSpace - $scope.volume.size, $scope.volume.size ];// [300, 500, 100];
  
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
                    
  $scope.validate = function () {
    var valid = true;
    _.each($scope.forms, function(form) {
      if (form.$invalid || !form.$valid) {
        return valid = false;
      }
    });
    return valid;
  };
 
  $scope.ok = function() {
    $log.debug("Closing modal with success!");
    
    // Accumulate config name-value pairs
    var config = {};
    angular.forEach(_.concat($scope.required, $scope.optional), function(cfg) {
      config[cfg.name] = cfg.value;
    });
    
    // Specify default values for unused fields
    angular.forEach(_.differenceBy($scope.options, $scope.optional, 'name'), function(def) {
      config[def.name] = def.value;
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