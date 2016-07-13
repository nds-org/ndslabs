/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigureServiceController', [ '$scope', '$routeParams', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stacks', 'Specs', 
    function($scope, $routeParams, $location, $log, _, NdsLabsApi, Project, Stacks, Specs) {
      
  var reload = function() {
    return true;
  };
      
  var projectId = Project.project.namespace;
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { projectId = newValue.namespace; });
  $scope.$watch(function () { return Stacks.all; }, function(newValue, oldValue) {
    reload();
    $scope.stack = _.find(Stacks.all, [ 'id', _.split($routeParams.ssid, '-')[0] ]);
    $scope.service = _.find($scope.stack.services, [ 'id', $routeParams.ssid ]);
    $scope.spec = _.find(Specs.all, [ 'key', $scope.service.service ]);
    if ($scope.service) {
      $scope.selectedSpec = _.find(Specs.all, [ 'key', $scope.service.service ]);
      
      $scope.configs = [];
      angular.forEach($scope.service.config, function(value, key) {
        var cfg = _.find($scope.spec.config, [ 'name', key ]);
        if (cfg) {
          $scope.configs.push({ 'name': key, 'label': cfg.label, 'value': value, 'def': cfg.value, 'isPassword':cfg.isPassword });
        } else {
          $scope.configs.push({ 'name': key, 'value': value, 'def': '', 'isPassword':false, canEdit: true });
        }
      });
      
      // TODO: volumes are not currently supported
      $scope.volumes = [];
      angular.forEach($scope.service.volumeMounts, function(vol) {
        $scope.volumes.push({ 'from': 'default/path', 'to': vol.mountPath });
      });
      
      // TODO: volumes are not currently supported
      $scope.ports = [];
      angular.forEach($scope.service.ports, function(port) {
        $scope.ports.push({ 'protocol': port.protocol, 'port': port.number, 'exposure': 'Internal' });
      });
    }
  });
  

  /* TODO: This is FAR too many manual watchers... */
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { $scope.project = newValue; });
  /*
  $scope.$watch('selectedSpec', function(newValue, oldValue) {
    if (newValue) {
    }
  });
  
  $scope.$watch('newStack.services', function() {
      $scope.configs = [];
      angular.forEach($scope.selectedSpec.config, function(cfg) {
        $scope.configs.push({ 'key': cfg.label || cfg.name, 'value': cfg.value, 'def': cfg.value });
      });
      
      $scope.volumes = [];
      angular.forEach($scope.selectedSpec.volumeMounts, function(vol) {
        $scope.volumes.push({ 'from': 'default/path', 'to': vol.mountPath });
      });
  });*/
  
  $scope.forms = {};
  
  $scope.isValid = function(spec, stack) {
    if (!$scope.selectedSpec || $scope.newStack.name === '') {
      return false;
    }
    
    var isValid = true;
    
    // Passwords are required
    angular.forEach($scope.configs, function(cfg) {
      if (cfg.isPassword && cfg.value === '') {
        isValid = false;
      }
    });
    
    // Default volume maps are required
    angular.forEach($scope.volumes, function(vol) {
      if (vol.from === '' || vol.to === '') {
        isValid = false;
      }
    });
    
    return isValid;
  };
  
  $scope.save = function() {
    // Install this app to etcd
    var upsert = function (arr, key, newval) {
      var match = _.find(arr, key);
      if(match){
          var index = _.indexOf(arr, _.find(arr, key));
          arr.splice(index, 1, newval);
      } else {
          arr.push(newval);
      }
    };
    
    // Parse environment vars into config map
    $scope.service.config = {};
    angular.forEach($scope.configs, function(cfg) {
      // Do not allow for empty passwords
      if (cfg.isPassword && cfg.value === '') {
        // TODO: Generate random secure passwords here!
        cfg.value = 'GENERATED_PASSWORD';
      }
      
      $scope.service.config[cfg.name] = cfg.value;
    });
    
    
    return NdsLabsApi.putProjectsByProjectIdStacksByStackId({ 'stackId': $scope.stack.id, 'stack': $scope.stack, 'projectId': projectId }).then(function(stack, xhr) {
      $log.debug("successfully posted to /projects/" + projectId + "/stacks!");
      
      // TODO: Only update changed stack?
      Stacks.populate(projectId);
      
      $location.path('/home');
    }, function(headers) {
      $log.error("error putting to /projects/" + projectId + "/stacks!");
    });
  };
  
  $scope.cancel = function() {
    // Add the new stack to the UI
    $location.path('/home');
  };
}]);
