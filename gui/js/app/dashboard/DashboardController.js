/* global angular:false */

angular
.module('ndslabs')
/**
 * The main view of our app, this controller houses the
 * "Dashboard" portion of the interface
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('DashboardController', [ '$scope', '$log', '$routeParams', '$location', '$interval', '$q', '$window', '$filter', '$uibModal', '_', 'Project', 'RandomPassword', 'Stack', 'Stacks', 'Specs', 'AutoRefresh',
    'StackService', 'NdsLabsApi', function($scope, $log, $routeParams, $location, $interval, $q, $window, $filter, $uibModal, _, Project, RandomPassword, Stack, Stacks, Specs, AutoRefresh,
    StackService, NdsLabsApi) {
  
  $scope.expandedStacks = {};
  
  /** 
   * FIXME: Temporary hack to update $scope when service data changes.
   * I am hoping asynchronous updates will allow me to remove this/these hack(s)
   */
  var sync = {};
  sync.project = function(newValue, oldValue) { $scope.project = newValue; };
  sync.specs = function(newValue, oldValue) { $scope.allServices = newValue; };
  sync.stacks = function(newValue, oldValue) {
    if (newValue) {
      $scope.configuredStacks = newValue;
      angular.forEach(newValue, function(stack) {
        if (!angular.isDefined($scope.expandedStacks[stack.id])) {
          $scope.expandedStacks[stack.id] = (stack.key === $routeParams.expand);
        }
      });
    }
  };
   
  $scope.$watch(function () { return Project.project }, sync.project);
  $scope.$watch(function () { return Specs.all }, sync.specs);
  $scope.$watch(function () { return Stacks.all }, sync.stacks);

  // Accounting stuff
  $scope.autoRefresh = AutoRefresh;
  
  // Watch for transitioning stacks (their status will end with "ing")
  $scope.$watch('configuredStacks', function(oldValue, newValue) {
    var transient = _.find(Stacks.all, function(stk) {
      return _.includes(stk.status, 'ing');
    });
    
    if (!transient && AutoRefresh.interval) {
      AutoRefresh.stop();
      $scope.launchingFileManager = false;
    } else if (transient && !AutoRefresh.interval) {
      if (transient.key === 'cloudcmd') {
        $scope.launchingFileManager = true;
      }
      AutoRefresh.start();
    }
  });
  
  $scope.starting = {};
  $scope.stopping = {};
  
  /**
   * Starts the given stack's services one-by-one and does a "soft-refresh" when complete
   * @param {Object} stack - the stack to launch
   */ 
  $scope.startStack = function(stack) {
    AutoRefresh.start();
    $scope.starting[stack.id] = true;
    
    // Then send the "start" command to the API server
    return NdsLabsApi.getStartByStackId({
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully started ' + stack.name);
    }, function(headers) {
      $log.error('failed to start ' + stack.name);
    }).finally(function() {
      $scope.starting[stack.id] = false;
    });
  };
  
  $scope.renameStack = function(stack) {
    // See 'app/dashboard/modals/stackStop/stackStop.html'
    $uibModal.open({
      animation: true,
      templateUrl: 'app/dashboard/modals/stackRename/stackRename.html',
      controller: 'StackRenameCtrl',
      size: 'md',
      keyboard: false,
      backdrop: 'static',
      resolve: {
        stack: function() { return stack; },
      }
    });
  };
  
  /**
   * Stops the given stack's services one-by-one and does a "soft-refresh" when complete
   * @param {Object} stack - the stack to shut down
   */ 
  $scope.stopStack = function(stack) {
    // See 'app/dashboard/modals/stackStop/stackStop.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/dashboard/modals/stackStop/stackStop.html',
      controller: 'StackStopCtrl',
      size: 'md',
      keyboard: false,
      backdrop: 'static',
      resolve: {
        stack: function() { return stack; },
      }
    });

    // Define what we should do when the modal is closed
    modalInstance.result.then(function(stack) {
      AutoRefresh.start();
      $scope.stopping[stack.id] = true;
    
      // Then send the "stop" command to the API server
      return NdsLabsApi.getStopByStackId({
        'stackId': stack.id
      }).then(function(data, xhr) {
        $log.debug('successfully stopped ' + stack.name);
      }, function(headers) {
        $log.error('failed to stop ' + stack.name);
      })
      .finally(function() {
        $scope.stopping[stack.id] = false;
      });
    });
  };
  
  /** 
   * Remove a service from a stopped stack 
   * @param {Object} stack - the stack to remove the service from
   * @param {Object} service - the service to remove
   */
  $scope.removeStackSvc = function(stack, svc) {
    // Remove this services locally
    stack.services.splice(stack.services.indexOf(svc), 1);
    
    // Then update the entire stack in etcd
    return NdsLabsApi.putStacksByStackId({
      'stack': stack,
      'stackId': stack.id
    }).then(function(data, xhr) {
      $log.debug('successfully removed service ' + svc.service + ' from stack ' + stack.name);
    }, function(headers) {
      $log.error('failed to remove service ' + svc.service + ' from stack ' + stack.name);
      
      // Restore our state from etcd
      Stacks.populate();
    });
  };
  
  /**
   * Display a modal window showing running log data for the given service
   * @param {} service - the service to show logs for
   */ 
  $scope.showLogs = function(service) {
    // See 'app/dashboard/modals/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: 'app/dashboard/modals/logViewer/logViewer.html',
      controller: 'LogViewerCtrl',
      windowClass: 'log-modal-window',
      size: 'lg',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: {
        service: function() { return service; }
      }
    });
  };
  
  /**
   * Display a modal window showing running log data for the given service
   * @param {} service - the service to show logs for
   */ 
  $scope.showConfig = function(service) {
    // See 'app/dashboard/modals/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: 'app/dashboard/modals/configViewer/configViewer.html',
      controller: 'ConfigViewerCtrl',
      size: 'md',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: {
        service: function() { return service; }
      }
    });
  };
  
  /**
   * Deletes a stack from etcd, if successful it is removed from the UI.
   * @param {Object} stack - the stack to delete
   */
  $scope.deleteStack = function(stack) {
    // See 'app/dashboard/modals/stackDelete/stackDelete.html'
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/dashboard/modals/stackDelete/stackDelete.html',
      controller: 'StackDeleteCtrl',
      size: 'md',
      keyboard: false,
      backdrop: 'static',
      resolve: {
        stack: function() { return stack; },
      }
    });

    // Define what we should do when the modal is closed
    modalInstance.result.then(function() {
      // Delete the stack
      return NdsLabsApi.deleteStacksByStackId({
        'stackId': stack.id
      }).then(function(data, xhr) {
        $log.debug('successfully deleted stack: ' + stack.name);
        Stacks.populate();
      }, function(headers) {
        $log.error('failed to delete stack: ' + stack.name);
      });
    });
  };
  
  $scope.launchFileManager = function() {
    var fileMgrKey = 'cloudcmd';
    
    var navigate = function(stack) {
      var cc = _.find(stack.services, [ 'service', fileMgrKey ]);
      var ep = _.head(cc.endpoints);
      if (ep) {
        //$window.location.href = $filter('externalHostPort')(ep);
        $window.open($filter('externalHostPort')(ep), '_blank');
      }
    };
    
    var startAndNavigate = function(stack) {
      $scope.launchingFileManager = $scope.stopping[stack.id] = true;
      if (stack.status !== 'started') {
        return NdsLabsApi.getStartByStackId({
            'stackId': stack.id
          }).then(function(started, xhr) {
            $log.debug('successfully started file manager: ' + stack.id);
            navigate(started);
          }, function(headers) {
            $log.error('failed to start file manager: ' + stack.id);
          }).finally(function() {
            $scope.launchingFileManager = $scope.starting[stack.id] = false;
          });
      } else {
        $scope.launchingFileManager = $scope.starting[stack.id] = false;
        navigate(stack);
      }
    };
    
    // Make sure we have ALL of our stacks first
    return Stacks.populate().then(function(stacks) {
      // Search for CloudCmd stack
      var stack = _.find(stacks, [ 'key', 'cloudcmd' ]);
      if (stack) {
        // If found, start it up
        startAndNavigate(stack);
      } else {
        // No Cloud Commander found.. install one
        var spec = _.find(Specs.all, [ 'key', 'cloudcmd' ]);
        
        if (!spec) {
          $log.error("No file manager found... aborting...");
          return;
        }
        
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
          $log.debug("successfully posted to /stacks!");
          
          startAndNavigate(stack);
          
          // Add /the new stack to the UI
          //Stacks.all.push(stack);
        }, function(headers) {
          $log.error("error posting to /stacks!");
        });
      }
    });
    
  };
}]);
