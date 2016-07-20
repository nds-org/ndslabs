/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Configuration Wizard" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('EditServiceController', [ '$scope', '$routeParams', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stacks', 'Specs', 
    function($scope, $routeParams, $location, $log, _, NdsLabsApi, Project, Stacks, Specs) {
      
  $scope.portProtocol = 'tcp';
  $scope.portNumber = 80;
  $scope.portExposure = 'internal';
  
  var projectId = Project.project.namespace;
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { projectId = newValue.namespace; });
  $scope.$watch(function () { return Stacks.all; }, function(newValue, oldValue) {
    $scope.stack = _.find(Stacks.all, [ 'id', _.split($routeParams.ssid, '-')[0] ]);
    
    if ($scope.stack) {
      $scope.service = _.find($scope.stack.services, [ 'id', $routeParams.ssid ]);
      
      if ($scope.service) {
        $scope.spec = _.find(Specs.all, [ 'key', $scope.service.service ]);
        
        $scope.imageRegistry = $scope.spec.image.registry;
        $scope.imageName = $scope.spec.image.name;
        $scope.imageTagOptions = $scope.spec.image.tags;
        
        $scope.configs = [];
        angular.forEach($scope.service.config, function(value, key) {
          var cfg = _.find($scope.spec.config, [ 'name', key ]);
          if (cfg) {
            $scope.configs.push({ 'name': key, 'label': cfg.label, 'value': value, 'def': cfg.value, 'isPassword':cfg.isPassword });
          } else {
            $scope.configs.push({ 'name': key, 'value': value, 'def': '', 'isPassword':false, canEdit: true });
          }
        });
        
        $scope.volumes = [];
        angular.forEach($scope.service.volumeMounts, function(to, from) {
          $scope.volumes.push({ from: from, to: to, canEdit: !_.find($scope.spec.volumeMounts, [ 'mountPath', to ]) });
        });
        
        if (!$scope.service.ports) {
          $scope.service.ports = [];
        }
        
        // TODO: ports are not currently supported
        $scope.ports = [];
        angular.forEach($scope.service.ports, function(port) {
          var specPort = _.find($scope.spec.ports, { protocol: port.protocol, number: port.number });
          $scope.ports.push({ protocol: port.protocol, number: port.number, exposure: 'Internal', canEdit: !specPort });
        });
      }
    }
  });
  
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { $scope.project = newValue; });
  
  /*$scope.isValid = function(spec, stack) {
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
  };*/
  
  $scope.deleteVolumeMount = function(from) {
    delete $scope.service.volumeMounts[from];
  };
  
  $scope.save = function() {
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
    
    $scope.service.volumeMounts = {};
    angular.forEach($scope.volumes, function(mnt) {
      $scope.service.volumeMounts[mnt.from] = mnt.to;
    });
    
    $scope.service.ports = $scope.ports;
    debugger;
    
    return NdsLabsApi.putStacksByStackId({ 'stackId': $scope.stack.id, 'stack': $scope.stack }).then(function(stack, xhr) {
      $log.debug("successfully posted to /projects/" + projectId + "/stacks!");
      
      // TODO: Only update changed stack?
      Stacks.populate(projectId).then(function() {
        $location.path('/home');
      });
    }, function(headers) {
      $log.error("error putting to /projects/" + projectId + "/stacks!");
    });
  };
  
  $scope.cancel = function() {
    // Add the new stack to the UI
    $location.path('/home');
  };
}]);
