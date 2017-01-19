/* global angular:false */

angular
.module('ndslabs')
.filter('stackExistsFromSpec', [ '_', 'Stacks', function(_, Stacks) {
  "use strict";
  
  return function(input) {
    var exists = false;
    angular.forEach(Stacks.all, function(stack) {
      var check = _.find(stack.services, [ 'service', input ]);
      if (check) {
        exists = true;
      }
    });
    return exists;
  };
}])
/**
 * The Controller for our "AppStore" / "Catalog" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('CatalogController', [ '$scope', '$filter', '$interval', '$uibModal', '$location', '$log', '_', 'NdsLabsApi', 'Project', 'Stack', 'Stacks', 
    'StackService', 'Specs', 'clipboard', 'Vocabulary', 'RandomPassword', 'AuthInfo', 'LandingRoute', 'ProductName',
    function($scope, $filter, $interval, $uibModal, $location, $log, _, NdsLabsApi, Project, Stack, Stacks, StackService, Specs, clipboard, Vocabulary, RandomPassword, AuthInfo, LandingRoute, ProductName) {
  "use strict";
      
  
  if (!AuthInfo.get().token) {
    $location.path(LandingRoute);
    return;
  }    
  
  $scope.productName = ProductName;
      
  $scope.tags = { all: [], selected: [] };
  Vocabulary.populate("tags").then(function(data) {
    $scope.tags.all = data;
  });

  $scope.loadTags = function($query) {
    return Vocabulary.populate("tags").then(function(data) {
      $scope.tags.all = data;
      return _.filter($scope.tags.all.terms, function(term) {
        return term.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
      });
    });
  };
  
  $scope.addFilterTag = function(tagId) {
    // Skip tags that we have already added
    if (_.find($scope.tags.selected, ['id', tagId ])) {
      return '';
    }
    
    // Look up and push new tags selected
    var tag = _.find($scope.tags.all.terms, [ 'id', tagId ]);
    $scope.tags.selected.push(tag);
  };

  var projectId = Project.project.namespace;
  
  $scope.showCards = true;
  
  $scope.installMax = 40;
      
  $scope.showStandalones = false;
  $scope.mode = 'cards';
  
  $scope.installs = {};
  
  var perRow = 3;
  
  var refilter = function(specs, tags) {
    $scope.filteredSpecs = $filter('display')(specs);
    $scope.filteredSpecs = $filter('showTags')($scope.filteredSpecs, tags);
    $scope.filteredSpecs = $filter('orderBy')($scope.filteredSpecs, 'label');
    $scope.chunkedSpecs = _.chunk($scope.filteredSpecs, perRow);
  };

  /* TODO: This is FAR too many manual watchers... */
  /* We might consider off-loading the filtering onto the API server, if we run into scaling issues here */
  $scope.$watch(function () { return Specs.all; }, function(newValue, oldValue) {
    $scope.installs = {};
    angular.forEach(newValue, function(spec) {
      var cnt =  _.filter(Stacks.all, [ 'key', spec.key ]).length;
      $scope.installs[spec.key] = { count: cnt, progress: 0 };
    });
    
    refilter($scope.specs = newValue, $scope.tags.selected);
  });
  $scope.$watch(function () { return Stacks.all; }, function(newValue, oldValue) {
    $scope.installs = {};
    angular.forEach(Specs.all, function(spec) {
      var cnt =  _.filter(newValue, [ 'key', spec.key ]).length;
      $scope.installs[spec.key] = { count: cnt, progress: 0 };
    });
  });
  $scope.$watch(function () { return Project.project; }, function(newValue, oldValue) { projectId = newValue.namespace; });
  $scope.$watch('tags.selected', function(newValue, oldValue) { refilter($scope.specs, newValue); }, true);
  
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
    delete specCopy.id;
    delete specCopy.privileged;
    delete specCopy.catalog;
    
    // Remove empty fields and sub-fields
    ($scope.stripEmptyFields = function(spec) {
      if (_.isArray(spec)) {    // Arrays
        angular.forEach(spec, function(arrVal) {
          $scope.stripEmptyFields(arrVal);
        });
      } else {                  // Objects
        angular.forEach(spec, function(value, key) {
          if (angular.isUndefined(value) || value === null || !value || (_.isArray(value) && value.length === 0)) {
            delete spec[key];
          } else if (_.isArray(spec[key])) {   // Arrays
            $scope.stripEmptyFields(spec[key]);
          }
        });
      }
    })(specCopy); // jshint ignore:line
    
    clipboard.copyText(JSON.stringify(specCopy, null, 4));
  };
  
  $scope.cloneSpec = function(spec) {
    $uibModal.open({
      animation: true,
      templateUrl: 'app/catalog/modals/clone/cloneSpec.html',
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
      templateUrl: 'app/catalog/modals/export/exportSpec.html',
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
      templateUrl: 'app/catalog/modals/import/importSpec.html',
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
      templateUrl: 'app/catalog/modals/delete/deleteSpec.html',
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
          cfg.value = RandomPassword.generate();
        }
        
        configMap[cfg.name] = cfg.value;
      });
      
      svc.config = configMap;
    });
    
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
