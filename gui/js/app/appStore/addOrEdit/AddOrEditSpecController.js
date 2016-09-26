/* global angular:false */

angular
.module('ndslabs')
.filter('invertSpecList', [ 'Specs', '_', function(Specs, _) {
  return function(input, myKey) {
    return _.filter(Specs.all, function(spec) {
      return !_.find(input, [ 'key', spec.key ])
        && !_.find(input, [ 'key', myKey ]);
    });
  };
}])
/**
 * The Controller for our "Add Spec" / "Edit Spec" views
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddOrEditSpecController', [ '$scope', '$log', '$location', '$routeParams', '_', 'NdsLabsApi', 'Specs', 'Spec', 'Vocabulary',  'Project', 'AuthInfo', 'LandingRoute', 'ProductName',
    function($scope, $log, $location, $routeParams, _, NdsLabsApi, Specs, Spec, Vocabulary, Project, AuthInfo, LandingRoute, ProductName) {
  
  if (!AuthInfo.get().token) {
    $location.path(LandingRoute);
    return;
  }    
  
  $scope.productName = ProductName;
  
  var path = $location.path();
  //$scope.editingSpec = (path.indexOf('edit') !== -1);
  $scope.editingSpec = (path.indexOf('/edit/') !== -1);
  
  $scope.newRepoType = '';
  $scope.showInUi = false;
  
  $scope.develEnv = ''
  
  // Update view when our spec list reloads
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) {
    if (newValue && newValue.resourceLimits) {
      $scope.limits = newValue.resourceLimits;
    }
  });
  
  $scope.$watch('newCfgIsPassword', function(newValue, oldValue) {
    if (newValue) {
      $scope.newCfgCanOverride = true;
      $scope.newCfgValue = '';
    }
  });
  
  Vocabulary.populate("tags").then(function(data) {
    $scope.tags = data.terms;
  });
  
  $scope.toggleHttps = function() {
    var newPort = $scope.probe.port === 443 ? 80 : 443;
    $scope.probe.port = newPort;
  };
  
  $scope.addKeyword = function(keyword) {
    if ($scope.spec.tags.indexOf(keyword) === -1) { 
      $scope.spec.tags.push(keyword);
    }
  };
  
  $scope.deleteKeyword = function(keyword) {
    var index = $scope.spec.tags.indexOf(keyword);
    if (index !== -1) {
      $scope.spec.tags.splice(index, 1);
    }
  };
  
  $scope.forms = {};
  
  // Set up some common defaults
  $scope.portProtocol = 'http';
  $scope.portNumber = 1;
  
  $scope.probe = {
    type: 'none',
    path: '',
    port: 80,
    initialDelay: 15,
    timeout:45,
  };
  
  $scope.$watch('spec.key', function(newValue, oldValue) {
    if (newValue && !$scope.editingSpec) {
      $scope.keyUnique = !_.find(Specs.all, [ 'key', newValue ]);
    } else {
      $scope.keyUnique = true;
    }
  })

  // Update view when our spec list reloads
  $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) {
    if (!newValue) {
      return;
    }
    
    $scope.specs = newValue;
    
    // If a key is given, this is an edit, otherwise it is an add
    if ($scope.editingSpec) {
      $scope.key = $routeParams.specKey;
      NdsLabsApi.getServicesByServiceId({ serviceId: $scope.key }).then(function(data) {
        $scope.spec = data;
        $scope.spec.tags = $scope.spec.tags || [];
        $scope.spec.image.tags = $scope.spec.image.tags || [];
        $scope.spec.config = $scope.spec.config || [];
        $scope.spec.depends = $scope.spec.depends || [];
        $scope.spec.command = _.join($scope.spec.command, ' ');
        $scope.spec.args = _.join($scope.spec.args, ' ');
        
        // Grab existing readiness probe or set up a new one
        $scope.probe = $scope.spec.readinessProbe || {
          type: '',
          path: '',
          port: 80,
          initialDelay: 15,
          timeout:45,
        };
      });
    } else {
      $scope.spec = new Spec();
      // Grab existing readiness probe or set up a new one
      $scope.probe = angular.copy($scope.spec.readinessProbe) || {
        type: '',
        path: '',
        port: 80,
        initialDelay: 15,
        timeout:45,
      };
    }
  });
  
  $scope.removeItem = function(target, obj) {
    target.splice(target.indexOf(obj), 1);
  };
  
  $scope.addItem = function(targetName, obj) {
    if (!$scope.spec[targetName]) {
      $scope.spec[targetName] = [];
    }
    $scope.spec[targetName].push(obj);
  };
  
  // Save the changes made on this page
  $scope.save = function(display) {
    var method = $scope.editingSpec ? 'putServicesByServiceId' : 'postServices';
    
  
    var spec = angular.copy($scope.spec);
    spec.display = 'stack';
    if (!$scope.spec.command || $scope.spec.command.replace(/ /g,'') === '') {
      spec.command = null;
    } else {
      spec.command = _.split($scope.spec.command, ' ');
    }
    
    if (!$scope.spec.args || $scope.spec.args.replace(/ /g,'') === '') {
      spec.args = null;
    } else {
      spec.args = _.split($scope.spec.args, ' ');
    }
    
    // Parse readinessProbe back into the spec
    if ($scope.probe.type === '') {
      spec.readinessProbe = null;
    } else {
      spec.readinessProbe = angular.copy($scope.probe);
    }
    
    console.debug(spec);
    return NdsLabsApi[method]({ service: spec, serviceId: spec.key }).then(function(data) {
      // TODO: Only populate changed spec?
      Specs.populate().then(function() {
        $location.path('/store');
      });
    });
  };
  
  $scope.cancel = function() {
    // Add the new stack to the UI
    $location.path('/store');
  };
}]);