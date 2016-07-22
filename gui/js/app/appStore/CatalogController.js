/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('CatalogController', [ '$scope', '$filter', '$interval', '$uibModal', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stack', 'Stacks', 
    'StackService', 'Specs', 'clipboard',
    function($scope, $filter, $interval, $uibModal, $location, $log, _, NdsLabsApi, Project, Stack, Stacks, StackService, Specs, clipboard) {
      
  var projectId = Project.project.namespace;
  
  $scope.showCards = true;
  
  $scope.installMax = 40;
      
  $scope.svcQuery = '';
  $scope.showStandalones = false;
  $scope.mode = 'cards';
  
  $scope.installs = {};
  
  var perRow = 4;
  
  $scope.stackExistsFor = function(spec) {
    var exists = false;
    angular.forEach(Stacks.all, function(stack) {
      var check = _.find(stack.services, [ 'service', spec.key ]);
      if (check) {
        exists = true;
      }
    });
    return exists;
  };
  
  var refilter = function(specs) {
    $scope.filteredSpecs = $filter('isStack')(specs, $scope.showStandalones);
    $scope.filteredSpecs = $filter('orderBy')($scope.filteredSpecs, 'label');
    $scope.filteredSpecs = $filter('filter')($scope.filteredSpecs, $scope.svcQuery);
    $scope.chunkedSpecs = _.chunk($scope.filteredSpecs, perRow);
  };

  /* TODO: This is FAR too many manual watchers... */
  $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) {
    $scope.installs = {};
    angular.forEach(newValue, function(spec) {
      var cnt =  _.filter(Stacks.all, [ 'key', spec.key ]).length;
      $scope.installs[spec.key] = { count: cnt, progress: 0 };
    });
    
    refilter($scope.specs = newValue);
  });
  $scope.$watch(function () { return Stacks.all; }, function(newValue, oldValue) {
    $scope.installs = {};
    angular.forEach(Specs.all, function(spec) {
      var cnt =  _.filter(newValue, [ 'key', spec.key ]).length;
      $scope.installs[spec.key] = { count: cnt, progress: 0 };
    });
  });
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { projectId = newValue.namespace; });
  $scope.$watch('svcQuery', function() { refilter($scope.specs); });
  $scope.$watch('showStandalones', function() { refilter($scope.specs); });
  
  $scope.copyToClipboard = function(spec) {
    if (!clipboard.supported) {
      alert('Sorry, copy to clipboard is not supported');
      return;
    }
    
    var specCopy = angular.copy(spec);
    
    // Remove unused / unnecessary fields
    delete specCopy.$$hashKey;
    delete specCopy.updateTime;
    delete specCopy.createdTime;
    
    clipboard.copyText(JSON.stringify(specCopy, null, 4));
  };
  
  $scope.cloneSpec = function(spec) {
    $uibModal.open({
      animation: true,
      templateUrl: 'app/appStore/modals/clone/cloneSpec.html',
      controller: 'CloneSpecCtrl',
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      resolve: {
        spec: spec
      }
    });
  };
  
  $scope.openExport = function(spec) {
    $uibModal.open({
      animation: true,
      templateUrl: 'app/appStore/modals/export/exportSpec.html',
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
      templateUrl: 'app/appStore/modals/import/importSpec.html',
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
      templateUrl: 'app/appStore/modals/delete/deleteSpec.html',
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
    var specDetails = $scope.installs[spec.key] || ($scope.installs[spec.key] = { count: 0, progress: 0, interval: null });
    specDetails.progress = 1;
    
    console.log('Installing ' + spec.label + '...');
    
    var increment = 5;
    
  	specDetails.interval = $interval(function() {
				if (specDetails.progress < $scope.installMax) {
				  specDetails.progress += increment;
				} else {
          specDetails.count += 1;
				  specDetails.progress = 0;
				  $interval.cancel(specDetails.interval);
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
    return NdsLabsApi.postStacks({ 'stack': app }).then(function(stack, xhr) {
      $log.debug("successfully posted to /projects/" + projectId + "/stacks!");
      
      // Add /the new stack to the UI
      Stacks.all.push(stack);
    }, function(headers) {
      $log.error("error posting to /projects/" + projectId + "/stacks!");
    });
  };
}]);
