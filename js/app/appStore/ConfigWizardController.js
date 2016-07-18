/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigurationWizardController', [ '$scope', '$filter', '$interval', '$uibModal', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stack', 'Stacks', 'Volume', 
    'StackService', 'Grid', 'Wizard', 'WizardPage', 'Specs', 'Volumes', 'ServiceDiscovery', 'clipboard',
    function($scope, $filter, $interval, $uibModal, $location, $log, _, NdsLabsApi, Project, Stack, Stacks, Volume, StackService, Grid, Wizard, WizardPage,
    Specs, Volumes, ServiceDiscovery, clipboard) {
      
  var projectId = Project.project.namespace;
  
  $scope.showCards = true;
  
  $scope.installMax = 40;
      
  $scope.svcQuery = '';
  $scope.showStandalones = false;
  $scope.mode = 'cards';
  
  $scope.installs = {};
  
  var refilter = function(specs) {
    $scope.filteredSpecs = $filter('isStack')(specs, $scope.showStandalones);
    $scope.filteredSpecs = $filter('orderBy')($scope.filteredSpecs, 'label');
    $scope.filteredSpecs = $filter('filter')($scope.filteredSpecs, $scope.svcQuery);
    $scope.chunkedSpecs = _.chunk($scope.filteredSpecs, 3);
  };

  /* TODO: This is FAR too many manual watchers... */
  $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) { refilter($scope.specs = newValue); });
  $scope.$watch(function () { return Stacks.all; }, function(newValue, oldValue) {
    $scope.installs = {};
    angular.forEach(Specs.all, function(spec) {
      var cnt =  _.filter(Stacks.all, [ 'key', spec.key ]).length;
      $scope.installs[spec.key] = { count: cnt, progress: 0 };
    });
  });
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { projectId = newValue.namespace; });
  $scope.$watch('svcQuery', function() { refilter($scope.specs); });
  $scope.$watch('showStandalones', function() { refilter($scope.specs); });
  
  $scope.copyToClipboard = function(spec) {
    if (!clipboard.supported) {
      console.log('Sorry, copy to clipboard is not supported');
      return;
    }
    
    var specCopy = angular.copy(spec);
    
    // Remove unnecessary fields
    delete specCopy.$$hashKey;
    delete specCopy.updateTime;
    delete specCopy.createdTime;
    
    console.log('Copying!');
    clipboard.copyText(JSON.stringify(specCopy));
    console.log('Copied!');
  };
  
  $scope.openEdit = function(spec) {
    $location.path('#/store/edit/' + spec.key);
  };
  
  $scope.openExport = function(spec) {
    $uibModal.open({
      animation: true,
      templateUrl: 'app/appStore/export/exportSpec.html',
      controller: 'ExportSpecCtrl',
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      resolve: {
        spec: spec
      }
    });
  };
  
  $scope.openImport = function() {
    $uibModal.open({
      animation: true,
      templateUrl: 'app/appStore/import/importSpec.html',
      controller: 'ImportSpecCtrl',
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      resolve: {}
    });
  };
  
  $scope.openDelete = function(spec) {
    $uibModal.open({
      animation: true,
      templateUrl: 'app/appStore/delete/deleteSpec.html',
      controller: 'DeleteSpecCtrl',
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      resolve: {
        spec: spec
      }
    });
  };
  
  $scope.install = function(spec) {
    spec.installProgress = 1;
    spec.installCount = spec.installCount || 0;
    
    var specDetails = $scope.installs[spec.key] || ($scope.installs[spec.key] = { count: 0, progress: 0 });
    specDetails.progress = 1;
    
    console.log('Installing ' + spec.label + '...');
    
    var increment = 5;
    
  	spec.installInterval = $interval(function() {
				if ($scope.installs[spec.key].progress < $scope.installMax) {
				  $scope.installs[spec.key].progress += increment;
				} else {
          $scope.installs[spec.key].count += 1;
				  $scope.installs[spec.key].progress = 0;
				  $interval.cancel(spec.installInterval);
				}
			}, 200);
    
    var app = new Stack(spec);
    
    
    // Randomly generate any required passwords
    angular.forEach(app.services, function(svc) {
      var configMap = {};
      angular.forEach(svc.config, function(cfg) {
        if (cfg.isPassword) {
          // TODO: Generate random secure passwords here!
          cfg.value = 'GENERATED_PASSWORD';
        }
        
        configMap[cfg.name] = cfg.value;
      });
      
      svc.config = configMap;
    });
    
    console.log('Finished building ' + spec.label + ' JSON:');
    console.debug(app);
    
    
    // Install this app to etcd
    return NdsLabsApi.postProjectsByProjectIdStacks({ 'stack': app, 'projectId': projectId }).then(function(stack, xhr) {
      $log.debug("successfully posted to /projects/" + projectId + "/stacks!");
      
      // Add /the new stack to the UI
      Stacks.all.push(stack);
    }, function(headers) {
      $log.error("error posting to /projects/" + projectId + "/stacks!");
    });
  };
}]);
