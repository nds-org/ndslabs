/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigurationWizardController', [ '$scope', '$filter', '$interval', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stack', 'Stacks', 'Volume', 
    'StackService', 'Grid', 'Wizard', 'WizardPage', 'Specs', 'Volumes', 'ServiceDiscovery',
    function($scope, $filter, $interval, $location, $log, _, NdsLabsApi, Project, Stack, Stacks, Volume, StackService, Grid, Wizard, WizardPage,
    Specs, Volumes, ServiceDiscovery) {
      
  var projectId = Project.project.namespace;
  
  $scope.installMax = 200;
      
  $scope.svcQuery = '';
  $scope.showStandalones = false;
  $scope.mode = 'cards';
  
  $scope.installs = {};
  
  var refilter = function(specs) {
    $scope.filteredSpecs = $filter('isStack')(specs, $scope.showStandalones);
    $scope.filteredSpecs = $filter('orderBy')($scope.filteredSpecs, 'label');
    $scope.filteredSpecs = $filter('filter')($scope.filteredSpecs, $scope.svcQuery);
    $scope.chunkedSpecs = _.chunk($scope.filteredSpecs, 4);
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
  
  $scope.install = function(spec) {
    spec.installProgress = 1;
    spec.installCount = spec.installCount || 0;
    
    var specDetails = $scope.installs[spec.key] || ($scope.installs[spec.key] = { count: 0, progress: 0 });
    specDetails.progress = 1;
    
    console.log('Installing ' + spec.label + '...');
    
    var increment = 20;
    
  	spec.installInterval = $interval(function() {
				if ($scope.installs[spec.key].progress < $scope.installMax) {
				  $scope.installs[spec.key].progress += increment;
				} else {
          $scope.installs[spec.key].count += 1;
				  $scope.installs[spec.key].progress = 0;
				  $interval.cancel(spec.installInterval);
				}
			}, 500);
    
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
