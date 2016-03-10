angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigurationWizardCtrl', [ '$scope', '$log', '$uibModalInstance', 'Stack', 'Volume', 
    'StackService', 'Grid', 'Wizard', 'WizardPage', 'template', 'stacks', 'deps', 'configuredStacks', 'configuredVolumes',
    function($scope, $log, $uibModalInstance, Stack, Volume, StackService, Grid, Wizard, WizardPage, template, 
    stacks, deps, configuredStacks, configuredVolumes) {
  $scope.discoverVolumeReqs = function(stack) {
    var reusableVolumes = [];
    var requiredVolumes = [];
    angular.forEach(stack.services, function(requestedSvc) {
      var svcSpec = _.find(_.concat(stacks, deps), function(svc) { return svc.key === requestedSvc.service });
      if (svcSpec.requiresVolume === true) {
        var orphan = null;
        angular.forEach(configuredVolumes, function(volume) {
          if (!volume.attached && svcSpec.key === volume.service) {
            // This is an orphaned volume from this service... Prompt the user to reuse it
            orphan = volume;
            reusableVolumes.push(orphan);
          }
        });
        
        var newVolume = new Volume(stack, svcSpec);
        if (orphan !== null) {
          newVolume.id = orphan.id;
          newVolume.name = orphan.name;
        }
        requiredVolumes.push(newVolume);
      }
    });

    $scope.newStackOrphanedVolumes = reusableVolumes;
    $scope.newStackVolumeRequirements = requiredVolumes;
    
    // Select first orphan, in all cases
  };

  // TODO: Use queue for recursion?
  $scope.collectDependencies = function(targetSvc) {
    angular.forEach(targetSvc.depends, function(dependency) {
      var key = dependency.key;
      var required = dependency.required;
      var svc = _.find(deps, function(svc) { return svc.key === key });
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
     new WizardPage("require", "Required Services", {
        prev: null,
        canPrev: false,
        canNext: function() {
          return $scope.newStack && $scope.newStack.name !== '' 
                    && !_.find(configuredStacks, function(stack) { 
                      return stack.name === $scope.newStack.name;
                    });
        },
        next: function() { 
          if ($scope.newStackOptions.length > 0) {
            return 'options';
          } else if ($scope.newStackVolumeRequirements.length > 0) {
            return 'volumes';
          } else {
            return 'confirm';
          }
        },
        onNext: function() { 
          $scope.discoverVolumeReqs($scope.newStack); 
        }
     }, true),
     new WizardPage("options", "Select Optional Services", {
        prev: 'require',
        canPrev: true,
        canNext: true,
        onNext: function() {
          $log.debug("Adding optional selections to stack...");
          $scope.newStack.services = angular.copy($scope.newStackRequirements);
          angular.forEach($scope.optionalLinksGrid.selector.selection, function(option) {
            var svc = _.find(deps, function(svc) { return svc.key === option.service });
            $scope.collectDependencies(svc);
            $scope.newStack.services.push(new StackService($scope.newStack, svc));
          });

          $log.debug("Discovering volume requirements...");
          $scope.discoverVolumeReqs($scope.newStack); 
        },
        next: function() { 
          console.debug($scope.newStackVolumeRequirements);
          if ($scope.newStackVolumeRequirements.length === 0) {
            $log.debug('Going to confirm');
            return 'confirm';
          } else {
            $log.debug('Going to volumes');
            return 'volumes';
          }
        }
     }, true),
     new WizardPage("volumes", "Configure Volumes", {
        prev: 'options',
        canPrev: true,
        canNext: function() {
          var volumeParamsSet = true;
          angular.forEach($scope.newStackVolumeRequirements, function(volume) {
            // Check that all of our required parameters have been set
              if (!volume.id && !volume.name) {
                volumeParamsSet = false;
                return;
              }
          });
          return volumeParamsSet;
        },
        next: 'confirm',
        onNext: function() {
          $log.debug("Verifying that user has made valid 'Volume' selections...");
        }
     }, true),
     new WizardPage("confirm", "Confirm New Stack", {
        prev: 'volumes',
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
  var base = _.find(_.concat(deps, stacks), function(svc) { return svc.key === template.key });
  $scope.newStack.services.push(new StackService($scope.newStack, base));

  // Add required dependencies to the stack
  $scope.collectDependencies(template);
  $scope.newStackRequirements = $scope.newStack.services;
  
  // Gather requirements of optional components
  $scope.newStackOptionalDeps = {};
  angular.forEach($scope.newStackOptions, function(opt) {
    var spec = _.find(deps, function(service) { return service.key === opt.service });
    var required = [];
    angular.forEach(spec.depends, function(dep) {
      if (dep.required === true) {
        required.push(dep.key);
      }
    });
    $scope.newStackOptionalDeps[opt.service] = required;
  });
  
  $scope.ok = function () {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close({ 'stack': $scope.newStack, 'volumes': $scope.newStackVolumeRequirements });
  };

  $scope.close = function () {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);