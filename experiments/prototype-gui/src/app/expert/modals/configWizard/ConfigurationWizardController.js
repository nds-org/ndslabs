angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigurationWizardCtrl', [ '$scope', '$filter', '$log', '$uibModalInstance', '_', 'Project', 'Stack', 'Volume', 
    'StackService', 'Grid', 'Wizard', 'WizardPage', 'template', 'stacks', 'deps', 'configuredStacks', 'configuredVolumes',
    function($scope, $filter, $log, $uibModalInstance, _, Project, Stack, Volume, StackService, Grid, Wizard, WizardPage, template, 
    stacks, deps, configuredStacks, configuredVolumes) {
  $scope.storageQuota = (Project.project.storageQuote || '50' );
  $scope.newStackVolumeRequirements = [];
  
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
          var used = $filter('usedStorage')(configuredVolumes);
          if (used == $scope.storageQuota) {
            // No room for any new volumes
            return false;
          }
      
          // Don't count orphaned volumesin our requested total (they are already part of "used")
          var diff = _.differenceBy($scope.newStackVolumeRequirements, configuredVolumes, 'id');
          var requested = $filter('usedStorage')(diff);
          var available = $scope.storageQuota - used;
          if (requested > available) {
            return false;
          }
          
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
  
  
  // Pager for multiple volume requirements
  $scope.currentPage = 0;
  $scope.getPageRange = function() {
    return [ $scope.currentPage-2, $scope.currentPage-1, $scope.currentPage, $scope.currentPage+1, $scope.currentPage+2 ];
  };
  $scope.setCurrentPage = function(newPage) {
    $scope.currentPage = newPage;
    $scope.volume = $scope.newStackVolumeRequirements[newPage];
  };
  
  
  $scope.ok = function () {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close({ 'stack': $scope.newStack, 'volumes': $scope.newStackVolumeRequirements });
  };

  $scope.close = function () {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}])
.controller('VolumeQuotaCtrl', [ '$scope', '$filter', 'Volumes', 'Project', '_', 
    function($scope, $filter, Volumes, Project, _) {
  $scope.chartObject = {};
  
  $scope.project = Project.project;
  $scope.storageQuota = Project.storageQuota || 50;
  $scope.configuredVolumes = Volumes.all;
  
  var adminEmail = Project.email || 'lambert8@illinois.edu';
  var subject = $filter('urlEncode')('Increasing My Storage Quota');
  var body = $filter('urlEncode')('Hello, Admin! I appear to have reach my storage limit of '
              + $scope.storageQuota + ' GB on ' + Project.namespace 
              + '. Could we please discuss options for increasing the ' 
              + 'storage quota of this project? Thank you! --' + Project.namespace);
  $scope.mailToLink = 'mailto:' + adminEmail 
                      + '?subject=' + subject
                      + '&body=' + body;
    
  $scope.chartObject.type = "PieChart";
  
  // Create an empty "table" for our chart object
  $scope.chartObject.data = {"cols": [
      {id: "t", label: "Volume", type: "string"},
      {id: "s", label: "Size (GB)", type: "number"}
  ], "rows": [  ]};
  
  // TODO: Add this field to the backend
  // Assumption: quota is in GB
  // Assumption: GB is lowest denomination
  var available = angular.copy($scope.storageQuota);
  
  var volumeSlices = [];
  if (Volumes.all.length > 0) {
    var pushVolume = function(volume) {
      var size = volume.sizeUnit === 'GB' ? volume.size : volume.size * 1000
      available -= size
      volumeSlices.push({ 
        'c': [ 
          {'v': volume.name }, 
          {'v': size }
        ]});
    };
  
    // Push a slice for each of our existing volumes
    angular.forEach(Volumes.all, function(volume) {
      pushVolume(volume);
    });
  }
  
  $scope.availableSpace = available;
  $scope.usedSpace = $scope.storageQuota - available;
  
  $scope.chartObject.options  = {
        'title': 'Storage Volumes',
        'is3D': true,
        'perSliceText': 'value'
  };
  
  
  // TODO: Enable this by adding field to backend project
  if (available > 0) {
    // Now push a slice representing our available space
    $scope.chartObject.data.rows.push({ 
      'c': [ 
        {'v': 'Available Space' }, 
        {'v': available }
      ]});
  
  
    $scope.chartObject.options.slices = {
      0: {offset: 0.4},
    };
  }
  
  // Now add the rest of our volumes
  $scope.chartObject.data.rows = _.concat($scope.chartObject.data.rows, volumeSlices);
}]);