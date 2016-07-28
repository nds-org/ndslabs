/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Edit Application Service" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddOrEditServiceController', [ '$scope', '$routeParams', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stacks', 'StackService', 'Specs', 
    function($scope, $routeParams, $location, $log, _, NdsLabsApi, Project, Stacks, StackService, Specs) {
      
  var path = $location.path();
  $scope.editingService = (path.indexOf('/edit/') !== -1);
  
  var projectId = null
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { projectId = newValue.namespace; });
  
  
  $scope.$watch(function () { return Stacks.all; }, function(newValue, oldValue) {
    var stackId = $routeParams.stackId;
    $scope.stack = _.find(Stacks.all, [ 'id', stackId ]);
    
    if (!$scope.stack) {
      return;
    }
    
    $scope.spec = _.find(Specs.all, [ 'key', $routeParams.service ]);
    
    if (!$scope.spec) {
      $log.error('Failed to find spec for ' + $scope.service.service);
      return;
    }
      
    $scope.service = _.find($scope.stack.services, [ 'service', $routeParams.service ]) || new StackService($scope.stack, $scope.spec);
    
    if (!$scope.service) {
      $log.error('Failed to' + ($scope.editingService ? 'find' : 'create') + $routeParams.service + ' in stack ' + $routeParams.stackId);
      $location.path('/home?expand=' + $scope.stack.key);
      return;
    }
    
    $scope.imageRegistry = $scope.spec.image.registry;
    $scope.imageName = $scope.spec.image.name;
    $scope.imageTagOptions = $scope.spec.image.tags;
    
    $scope.configs = [];
    angular.forEach($scope.service.config, function(value, key) {
      var cfg = null;
      if (angular.isNumber(key)) {
        cfg = _.find($scope.spec.config, [ 'name', value.name ]);
        // "Add service" case: Array of objects
        $scope.configs.push({ 'name': cfg.name, 'label': cfg.label, 'value': cfg.value, 'def': cfg.value, 'spec': cfg, 'isPassword':cfg.isPassword, 'canOverride':cfg.canOverride });
      } else {
        // "Edit service" case: map of strings
        cfg = _.find($scope.spec.config, [ 'name', key ]);
        if (!cfg) {
          $scope.configs.push({ 'name': key, 'value': value, 'def': '', 'isPassword':false, canEdit: true });
        } else {
          $scope.configs.push({ 'name': key, 'label': cfg.label, 'value': value, 'def': cfg.value, 'spec': cfg, 'isPassword':cfg.isPassword });
        }
      }
    });
    
    $scope.volumes = [];
    angular.forEach($scope.service.volumeMounts, function(to, from) {
      $scope.volumes.push({ from: from, to: to, canEdit: !_.find($scope.spec.volumeMounts, [ 'mountPath', to ]) });
    });
    
    // TODO: ports are not currently supported
    $scope.ports = [];
    angular.forEach($scope.service.endpoints, function(endPt) {
      $scope.ports.push({ protocol: endPt.protocol, port: endPt.port, access: 'Internal' });
    });
  });
  
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { $scope.project = newValue; });
  
  $scope.save = function() {
    $scope.service.volumeMounts = {};
    angular.forEach($scope.volumes, function(mnt) {
      $scope.service.volumeMounts[mnt.from] = mnt.to;
    });
    
    //$scope.service.ports = $scope.ports;
    $scope.service.endpoints = [];
    angular.forEach($scope.ports, function(port) {
      $scope.service.endpoints.push({ port: port.port, protocol: port.protocol, access: port.access} );
    });
    
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
    
    if (!$scope.editingService && $scope.stack.services.indexOf($scope.service) === -1) {
      angular.forEach($scope.spec.depends, function(dep) {
        var exists = _.find($scope.stack.services, function(svc) { return svc.service === dep.key });
        if (dep.required && !exists) {
          var spec = _.find(Specs.all, [ 'key', dep.key ]);
          $scope.stack.services.push(new StackService($scope.stack, spec));
        }
      });
      
      // Push the new service onto the stack
      $scope.stack.services.push($scope.service);
    }
    
    // Save the stack to etcd
    return NdsLabsApi.putStacksByStackId({ 'stackId': $scope.stack.id, 'stack': $scope.stack }).then(function(stack, xhr) {
      // TODO: Only update changed stack?
      Stacks.populate(projectId).then(function() {
        $location.path('/home');
        $location.search('expand', $scope.stack.key);
      });
    });
  };
  
  $scope.cancel = function() {
    // Add the new stack to the UI
    $location.path('/home');
    $location.search('expand', $scope.stack.key);
  };
}]);
