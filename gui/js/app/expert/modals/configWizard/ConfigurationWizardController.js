/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigurationWizardCtrl', [ '$scope', '$filter', '$log', '$uibModalInstance', '_', 'NdsLabsApi', 'Project', 'Stack', 'Volume', 
    'StackService', 'Grid', 'Wizard', 'WizardPage', 'template', 'Specs', 'configuredStacks', 'configuredVolumes', 'ServiceDiscovery',
    function($scope, $filter, $log, $uibModalInstance, _, NdsLabsApi, Project, Stack, Volume, StackService, Grid, Wizard, WizardPage, template, 
    Specs, configuredStacks, configuredVolumes, ServiceDiscovery) {
  $scope.storageQuota = Project.project.storageQuota;
  $scope.newStackVolumeRequirements = [];
  $scope.newStackOrphanedVolumes = [];
  $scope.extraConfig = {};
  
  $scope.forms = {};
  ($scope.onPageChange = function() {
    NdsLabsApi.getRefresh_token().then(function() {
      $log.debug("Refreshed token!");
    }, function() {
      $log.error("Failed to refresh token!");
    });
  })();
  
  $scope.rediscover = function(stack) {
    $scope.newStackOrphanedVolumes = ServiceDiscovery.discoverOrphanVolumes(stack);
    $scope.newStackVolumeRequirements = ServiceDiscovery.discoverRequiredVolumes(stack);
    $scope.extraConfig = ServiceDiscovery.discoverConfigRequirements(stack);
    
    // Select first volume req, if we found any
    if ($scope.newStackVolumeRequirements.length > 0) {
      $scope.volume = $scope.newStackVolumeRequirements[0];
    }
  };
    
  // TODO: Use queue for recursion?
  $scope.collectDependencies = function(targetSvc) {
    angular.forEach(targetSvc.depends, function(dependency) {
      var key = dependency.key;
      var required = dependency.required;
      var svc = _.find(Specs.deps, function(svc) { return svc.key === key });
      var stackSvc = new StackService($scope.newStack, svc);
      var targetArray = null;
      if (required) {
          targetArray = $scope.newStack.services;
      } else {
          targetArray = $scope.newStackOptions;
      }

      // Check if this service is already present on our proposed stack
      var exists = _.find($scope.newStack.services, function(svc) { return svc.service === key });
      if (!exists) {
        // Add the service if it has not already been added
        targetArray.push(stackSvc);
      } else {
        // Skip this service if we see it in the list already
        $log.debug("Skipping duplicate service: " + svc.key);
      }
    });
  };
  
  // The delay (in seconds) before allowing the user to click "Next"
  var initDelay = 0;

  // Define a big pile of logic for our wizard pages
  var configPages = [
    
    // Required Services
    new WizardPage("require", "Required Services", {
        prev: null,
        canPrev: false,
        canNext: function() {
          return $scope.forms['stackNameForm'].$valid;
        },
        next: function() { 
          if ($scope.newStackOptions.length > 0) {
            return 'options';
          } else if (!_.isEmpty($scope.extraConfig)) {
            return 'config';
          } else if ($scope.newStackVolumeRequirements.length > 0) {
            return 'volumes';
          } else {
            return 'confirm';
          }
        },
        onNext: function() {
          $scope.rediscover($scope.newStack);
        }
     }, true),
     
     // Optional Services
     new WizardPage("options", "Select Optional Services", {
        prev: 'require',
        canPrev: true,
        canNext: true,
        onNext: function() {
          $log.debug("Adding optional selections to stack...");
          $scope.newStack.services = angular.copy($scope.newStackRequirements);
          angular.forEach($scope.optionalLinksGrid.selector.selection, function(option) {
            var svc = _.find(Specs.deps, function(svc) { return svc.key === option.service });
            $scope.collectDependencies(svc);
            $scope.newStack.services.push(new StackService($scope.newStack, svc));
          });

          // Update config / volume based on optional services selected
          $scope.rediscover($scope.newStack);
          
          // TODO: Asynchronicity here is not handled by the wizard.
          /*var services = _.map($scope.newStack.services, 'service');
          debugger;
          NdsLabsApi.getConfigs({ 'services': services}).then(function(data, headers) {
            $scope.extraConfig = data;
          }, function() {
            $log.error('Failed to grab custom config for ' + services);
          });*/
          
        },
        next: function() { 
          if (!_.isEmpty($scope.extraConfig)) {
            $log.debug('Going to config');
            return 'config';
          } else if ($scope.newStackVolumeRequirements.length > 0) {
            $log.debug('Going to volumes');
            return 'volumes';
          } else {
            $log.debug('Going to confirm');
            return 'confirm';
          }
        }
     }, true),
     
     // Additional Service Configuration
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
     
     // Configure Volumes
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
          var used = $filter('usedStorage')(_.concat(configuredVolumes, $scope.newStackVolumeRequirements));
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
     }, true),
     
     // Confirm New Stack
     new WizardPage("confirm", "Confirm New Stack", {
        prev: function() {
          if ($scope.newStackVolumeRequirements.length > 0) {
            $log.debug('Going back to volumes');
            return 'volumes';
          } else if (!_.isEmpty($scope.extraConfig)) {
            $log.debug('Going back to config');
            return 'config';
          } else if ($scope.newStackOptions.length > 0) {
            $log.debug('Going back to options');
            return 'options';
          } else {
            $log.debug('Going back to requirements');
            return 'require';
          }
        },
        canPrev: true,
        canNext: false,
        next: null
     }, true)
  ];
  
  // Create a new Wizard to display
  $scope.wizard = new Wizard(configPages, initDelay);
  
  $scope.spec = template;
  $scope.newStack = new Stack(template);
  $scope.newStackLabel = template.label;
  $scope.newStackOptions = [];
  var pageSize = 100;
  $scope.optionalLinksGrid = new Grid(pageSize, function() { return $scope.newStackOptions; });

  // Add our base service to the stack
  var base = _.find(Specs.all, function(svc) { return svc.key === template.key });
  $scope.newStack.services.push(new StackService($scope.newStack, base));

  // Add required dependencies to the stack
  $scope.collectDependencies(template);
  $scope.newStackRequirements = $scope.newStack.services;
  
  // Gather requirements of optional components
  $scope.newStackOptionalDeps = {};
  angular.forEach($scope.newStackOptions, function(opt) {
    var spec = _.find(Specs.deps, function(service) { return service.key === opt.service });
    var required = [];
    angular.forEach(spec.depends, function(dep) {
      if (dep.required === true) {
        required.push(dep.key);
      }
    });
    $scope.newStackOptionalDeps[opt.service] = required;
  });
  
  // Pager for multiple volume requirements
  $scope.currentPage = 0;
  $scope.getPageRange = function() {
    return [ $scope.currentPage-2, $scope.currentPage-1, $scope.currentPage, $scope.currentPage+1, $scope.currentPage+2 ];
  };
  $scope.setCurrentPage = function(newPage) {
    $scope.currentPage = newPage;
    $scope.volume = $scope.newStackVolumeRequirements[newPage];
  };
  
  $scope.project = Project.project;
  $scope.configuredVolumes = configuredVolumes;
  
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
    
  // Assumptions: quota is in GB and GB is lowest storage denomination
  $scope.usedSpace = $filter('usedStorage')($scope.configuredVolumes);
  $scope.availableSpace = $scope.storageQuota - $scope.usedSpace;
  
  $scope.ok = function () {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close({ 'stack': $scope.newStack, 'volumes': $scope.newStackVolumeRequirements });
  };

  $scope.close = function () {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);
