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
  $scope.storageQuota = Project.project.storageQuota;
  $scope.usedSpace = $filter('usedStorage')(Volumes.all);
  $scope.availableSpace = $scope.storageQuota - $scope.usedSpace;
  $scope.configuredVolumes = Volumes.all;
  
  // Create a new stack service to bind against
  $scope.service = new StackService(stack, service);
  
  // Populate its Configuration requirements
  $scope.extraConfig = ServiceDiscovery.discoverConfigSingle(service.key);
      
  // Populate its Volume requirements and options
  $scope.volume = ServiceDiscovery.discoverRequiredSingle(stack, service.key);
  $scope.newStackOrphanedVolumes = ServiceDiscovery.discoverOrphansSingle(service.key);
  
  // Create singleton
  if ($scope.volume) {
    $scope.newStackVolumeRequirements = [ $scope.volume ];
  }
  
  // Additional Service Configuration
  var configPages = [
    new WizardPage("config", "Additional Configuration Required", {
      prev: function() {
        if ($scope.newStackOptions.length > 0) {
          $log.debug('Going to options');
          return 'options';
        } else {
          $log.debug('Going to requirements');
          return 'require';
        }
      },
      canPrev: true,
      canNext: function() {
        var canNext = true;
        angular.forEach($scope.extraConfig, function(configs, svcKey) {
          angular.forEach(configs.list, function(cfg) {
            if (cfg.value === '' && cfg.canOverride === true) {
              canNext = false;
            }
          });
        });
        return canNext;
      },
      onNext: function() {
        angular.forEach($scope.extraConfig, function(config, svcKey) {
          // Locate our target service
          var svc = _.find($scope.newStack.services, [ 'service', svcKey ]);
          
          // Accumulate config name-value pairs
          svc.config = {};
          angular.forEach(config.list, function(cfg) {
            svc.config[cfg.name] = cfg.value;
          });
        });
      },
      next: function() {
        if ($scope.newStackVolumeRequirements.length > 0) {
          $log.debug('Going to volumes');
          return 'volumes';
        } else {
          $log.debug('Going to confirm');
          return 'confirm';
        }
      }
    }, true),
    new WizardPage("volumes", "Configure Volumes", {
      prev: function() {
        if (!_.isEmpty($scope.extraConfig)) {
          $log.debug('Going to config');
          return 'config';
        } else if ($scope.newStackOptions.length > 0) {
          $log.debug('Going to options');
          return 'options';
        } else {
          $log.debug('Going to requirements');
          return 'require';
        }
      },
      canPrev: true,
      canNext: function() {
        var used = $filter('usedStorage')(_.concat($scope.configuredVolumes, $scope.newStackVolumeRequirements));
        if (used > $scope.storageQuota) {
          // No room for any new volumes
          return false;
        }
        
        // Ensure all volumes have either an id or a name, and have a size/unit set
        return _.every($scope.newStackVolumeRequirements, function(vol) {
          return vol.id || (vol.name && vol.size && vol.sizeUnit);
        });
      },
      next: 'confirm',
      onNext: function() {
        $log.debug("Verifying that user has made valid 'Volume' selections...");
      }
    }, true)
  ];
  
  // Create a new Wizard to display
  $scope.wizard = new Wizard(configPages, 0);
  
  $scope.ok = function(service) {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close(service);
  };
  
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);