/* global angular:false */

/**
 * This file defines shared data structures and constructors.
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/Services+and+Factories
 */
angular.module('ndslabs-services', [ 'ndslabs-api' ])

/**
 * Make lodash available for injection into services
 */ 
.constant('_', window._)

/** Helper service to enable/disable "Loading" indicator */
.factory('Loading', [ '$rootScope', function($rootScope) {
  "use strict";

  var minDuration = 700,
      delay = 250,
      message = 'Please Wait...';
  
  var ret = {};
  
  ret.setNavbarLoading = function(promise, backdrop) {
    $rootScope.loadingSmall = {
      promise: promise,
      message: message,
      delay: delay,
      backdrop: backdrop,
      minDuration: minDuration,
    };
    return promise;
  };
  
  ret.set = function(promise, backdrop) {
    $rootScope.loadPromise = promise;
    $rootScope.loading = {
      promise: promise,
      message: message,
      backdrop: backdrop,
      delay: delay,
      minDuration: minDuration,
      templateUrl: 'app/shared/loading.html'
    };
    return promise;
  };
  
  return ret;
}])

/** 
 *  Helper service to add/launch/navigate to a particular application by key 
 * 
 *  @constructor
 *  @param string quickstartKey: The key of the service spec to launch
 */
.factory('QuickStart', [ '$log', '$filter', '$timeout', '_', 'AutoRefresh', 'NdsLabsApi', 'Popup',
    function($log, $filter, $timeout, _, AutoRefresh, NdsLabsApi, Popup) {
  "use strict";
  
  var cache = {
    get: function(quickstartKey) {
      if (!quickstartKey) {
        $log.warn("WARNING: Empty quickstartKey encountered... ignoring.");
        return;
      }
      
      // Check if we've already created an instace of this quickstart
      var existing = cache[quickstartKey];
      if (existing) {
        return existing;
      }
      
      // No existing quickstart, so create and return a new one
      var quickstart = {
        busy: false,
        navigate: function(stack) {
          var cc = _.find(stack.services, [ 'service', quickstartKey ]);
          var ep = _.head(cc.endpoints);
          if (ep) {
            Popup.open($filter('externalHostPort')(ep));
          }
        },
        launch: function() {
          // Block multiple concurrent launches on the same service
          if (quickstart.busy) {
            $log.warn(`WARNING: QuickStart already starting ${quickstartKey}... ignoring.`);
            return;
          }
          
          quickstart.busy = true;
          /*$timeout(function() {
            AutoRefresh.start();
          }, 1000);*/
          return NdsLabsApi.getStart({
            'key': quickstartKey
          }).then(function(started, xhr) {
            $log.debug('Successfully started quickstartKey=' + quickstartKey + ', stackId=' + started);
            quickstart.navigate(started);
          }, function(headers) {
            $log.error('Failed to start quickstartKey=' + quickstartKey);
            alert(`Failed to start ${quickstartKey}. Please be sure that this application is available on your system.`);
          }).finally(function() {
            $timeout(function() {
              quickstart.busy = false;
            }, 10000);
          });
        }
      };
      
      return cache[quickstartKey] = quickstart;
    }
  };
  
  return cache;
}])

// TODO: Allow user to set their own file manager?
.constant('FileManagerKey', 'cloudcmd')

/** Specialized QuickStart service for launching the FileManager */
.factory('FileManager', [ 'QuickStart', 'FileManagerKey', 'NdsLabsApi',
    function(QuickStart, FileManagerKey,  NdsLabsApi) {
  "use strict";

  return QuickStart.get(FileManagerKey);
}])

/** Helper service for generating random secure passwords */
.factory('RandomPassword', [ function() {
  "use strict";

  return {
    generate: function(len) {
      var length = len || 10,
          charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          retVal = "";
      for (var i = 0, n = charset.length; i < length; ++i) {
          retVal += charset.charAt(Math.random() * n);
      }
      return retVal;
    }
  };
}])

/** 
 *  Decorator service for $log that will forward log messages 
 *  back to the server to output them in the container logs
 * 
 *  See ConfigModule.js
 */
.service('Logging', [ '$filter', '$injector', 'AuthInfo', function($filter, $injector, AuthInfo) {
  "use strict";

  var self = this;

  var service = {
    // Unused, very noisy
    /*debug: function() {
      self.type = 'debug';
      log.apply(self, arguments);
    },*/
    error: function() {
      self.type = 'error';
      log.apply(self, arguments);
    },
    warn: function() {
      self.type = 'warn';
      log.apply(self, arguments);
    },
    info: function() {
      self.type = 'info';
      log.apply(self, arguments);
    },
    log: function() {
      self.type = 'log';
      log.apply(self, arguments);
    },
    enabled: false,
    logs: []
  };

  var log = function() {
    var token = angular.copy(AuthInfo.get());
    var $http = $injector.get('$http');
    
    // Don't send these over the wire
    delete token.password;
    delete token.saveCookie;
    delete token.project;
  
    var args = [];
    if (typeof arguments === 'object') {
      // FIXME: these should probably all be a "let" instead of "var" (ES6)
      for(var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        var exception = {};
        exception.message = arg.message || arg;
        exception.stack = arg.stack;
        args.push(JSON.stringify(exception));
      }
    }
    
    var logItem = {
      token: token,
      time: $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      message: args.join('\n'),
      type: $filter('uppercase')(self.type)
    };
    
    console.log(logItem.time + ' [' + logItem.type + '] ' + logItem.message.toString());
    console.debug(logItem);
    
    $http({
     method: 'POST',
     url: '/logs',
     headers: {
       'Content-Type': 'application/json'
     },
     data: logItem
    }).then(function(data) {
      service.logs.push(logItem);
    }, function(response) {
      console.log('Error sending logItem back to server: ', logItem);
    });
  };

  return service;
}])

/** Helper service that will refresh server data without reloading the page */
.factory('SoftRefresh', [ 'Stacks', 'Project', 'Specs', function(Stacks, Project, Specs) {
  "use strict";

  var refresh = {
    /**
     * Perform a partial "soft-refresh" - refresh the stack data without fully re-rendering the page
     */ 
    stacks: function() {
      return Stacks.populate(Project.project.namespace);
     },
   
    /**
     * Perform a full "soft-refresh" - refresh all data without fully re-rendering the page
     */ 
    full: function() {
      Specs.populate();
      return Project.populate(Project.project.namespace).then(function() {
        return refresh.stacks();
      });
    }
  };
 
  return refresh;
}])

/** 
 *  Helper service that will automatically refresh server data 
 *  every 5 seconds without reloading the page
 */
.factory('AutoRefresh', [ '$interval', '$log', 'SoftRefresh', 'Loading', function($interval, $log, SoftRefresh, Loading) {
  "use strict";

  var autoRefresh = {
    interval: null,
    onInterval: SoftRefresh.stacks,
    periodSeconds: 5,
    start: function () {
      autoRefresh.stop();
      autoRefresh.interval = $interval(function() {
        Loading.set(autoRefresh.onInterval(), false);
        }, 1000 * autoRefresh.periodSeconds);
      $log.debug("Interval starting!");
    },
    stop: function() {
      if (autoRefresh.interval !== null) {
        while (!$interval.cancel(autoRefresh.interval)) { /* NOOP */ }
        autoRefresh.interval = null;
      }
      $log.debug("Interval stopped!");
      
    },
    toggle: function() {
      if (autoRefresh.interval === null) {
        autoRefresh.start();
      } else {
        autoRefresh.stop();
      }
    }
  };
  
  return autoRefresh;
}])

/**
 * A shared store for our project metadata pulled from /projects/{namespace}
 */
.factory('Project', [ '$log', 'NdsLabsApi', 'Loading', function($log, NdsLabsApi, Loading) {
  "use strict";

  var project = {
    /** Purge/delete all user account data */
    purge: function() {
      project.project = {};
    },
    
    /** Grab the project associated with our current namespace */
    populate: function(projectId) {
      return Loading.setNavbarLoading(NdsLabsApi.getAccountsByAccountId({ 
        "accountId": projectId 
      })).then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "!");
        project.project = data;
        
        return data;
      }, function(headers) {
        $log.debug("Error pulling account information: " + projectId);
      });
    },
    
    /** Generates a new Project object */
    create: function() {
      return {
        name: '',
        description: '',
        organization: '',
        namespace: '',
        email: '',
        password: '',
        passwordConfirmation: ''
      };
    },
    
    /** Lazy-loaded field for housing project data */
    project: {}
  };
    
  return project;
}])

/**
 * A shared store for service specs pulled from /services
 */
.factory('Specs', [ '$log', '_', 'Vocabulary', 'NdsLabsApi', function($log, _, Vocabulary, NdsLabsApi) {
  "use strict";

  // An empty place-holder for our service/stack specs
  var specs = {
    /** Purge/delete all catalog data */
    purge: function() {
      specs.all = specs.stacks = specs.deps = [];
    },
    
    /** Grab the current site's available services */ 
    populate: function() {
      // Grab the list of available services at our site
      return NdsLabsApi.getServices({ catalog: 'all' }).then(function(data, xhr) {
        $log.debug("successfully grabbed from /services!");
        specs.all = angular.copy(data);
        
        // Split out display === 'stack' vs 'standalone'
        specs.deps = angular.copy(data);
        specs.stacks = _.remove(specs.deps, function(svc) { return svc.stack === true; });
        
        // Split out catalog === 'system' vs 'user'
        specs.system = _.filter(angular.copy(data), [ 'catalog', 'system']);
        specs.user = _.filter(angular.copy(data), [ 'catalog', 'user']);
        
        // Default any HTTP ports to '/', if they are missing a contextPath
        angular.forEach(specs.all, function(spec) {
          angular.forEach(spec.ports, function(port) {
            if (port.protocol === 'http' && !port.contextPath) {
              port.contextPath = '/';
            }
          });
        });
        
        var devEnvTag = _.find(Vocabulary.all.terms, ['name', 'Development environment']);
        specs.devEnvs = _.filter(data, function(spec) {
          return spec.tags && spec.tags.indexOf(devEnvTag.id) !== -1;
        });
        
        return data;
      }, function (headers) {
        $log.error("error grabbing from /services!");
      });
    },
    
    /** Lazy-loaded categories to ease sorting */
    all: [],
    system: [],
    user: [],
    stacks: [],
    deps: [],
    devEnvs: []
  };
  
    // TODO: Populate this automatically? Seems like a bad idea...
  // specs.populate();
  
  return specs;
}])

/**
 * A shared store for stacks pulled from /projects/{namespace}/stacks
 */
.factory('Stacks', [ '$log', 'NdsLabsApi', function($log, NdsLabsApi) {
  "use strict";

  // An empty place-holder for our deployed stacks
  var stacks = {
    /** Purge/delete all user stack data */
    purge: function() {
      stacks.all = [];
    },
    
    /** Grab the list of configured stacks in our project */
    populate: function(projectId) {
      return NdsLabsApi.getStacks().then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "/stacks!");
        
        stacks.all = data || [];
        return stacks.all;
      }, function(headers) {
        $log.error("error grabbing from /projects/" + projectId + "/stacks!");
      });
    },
    
    /** Lazy-loaded categories to ease sorting */
    all: []
  };
  
  return stacks;
}])

/**
 * A shared store for stacks pulled from /projects/{namespace}/stacks
 */
.factory('Vocabulary', [ '$log', 'NdsLabsApi', function($log, NdsLabsApi) {
  "use strict";

  // An empty place-holder for our deployed stacks
  var vocab = {
    /** Purge/delete all catalog tag data */
    purge: function() {
      vocab.all = [];
    },
    
    /** Grab the list of configured stacks in our project */
    populate: function(name) {
      return NdsLabsApi.getVocabularyByVocabName({ vocabName: name }).then(function(data, xhr) {
        $log.debug("successfully grabbed vocab list for " + name + "!");
        vocab.all = data || [];
        return vocab.all;
      }, function(response) {
        $log.error("error grabbing vocab list!");
      });
    },
    
    /** Lazy-loaded categories to ease sorting */
    all: []
  };
  
  return vocab;
}])

/**
 * Represents a spec.
 * @constructor
 */
.service('Spec', [ '$log', 'Specs', '_', function($log, Specs, _) {
  "use strict";

  return function() {
    
      return {
      "id": "",
      "key": "",
      "label": "",
      "description": "",
      "logo": "/asset/png/logos/ndslabs-badge.png",
      "maintainer": "",
      "image": {
        "registry": "",
        "name": "",
        "tags": [ "latest" ]
      },
      "display": "stack",
      "access": "external",
      "depends": [],
      "config": [],
      "command": null,
      "args": null,
      "ports": [],
      "repository": [],
      "volumeMounts": [],
      "resourceLimits": {
        "cpuMax": 500,
        "cpuDefault": 100,
        "memMax": 1000,
        "memDefault": 50
      },
      "readinessProbe": {
          "type": '',
          "path": '/',
          "port": 80,
          "initialDelay": 15,
          "timeout":45,
        },
      "developerEnvironment": "",
      "tags": []
    };
  };
}])

/**
 * Represents a stack.
 * @constructor
 * @param {} spec - The service spec from which to create the stack
 */
.service('Stack', [ '$log', 'Specs', 'StackService', '_', function($log, Specs, StackService, _) {
  "use strict";

  return function(spec) {
    var key = spec.key;
            
    var stack = {
      id: "",
      name: angular.copy(spec.label),
      key: key,
      secure: angular.copy(spec.authRequired),
      status: "stopped",
      services: []
    };
    
    // Add our base service to the stack
    var base = _.find(Specs.all, [ 'key', key ]);
    stack.services.push(new StackService(stack, base));
    
    // Add required services to this stack
    angular.forEach(spec.depends, function(dep) {
      if (dep.required) {
        var svc = _.find(Specs.all, [ 'key', dep.key ]);
        stack.services.push(new StackService(stack, svc));
      }
    });
    
    return stack;
  };
}])

/**
 * Represents a stack service.
 * @constructor
 * @param {} stack - The stack to which this service should attach
 * @param {} spec - The service spec off of which to base this service
 */
.service('StackService', [ 'RandomPassword', function(RandomPassword) {
  "use strict";

  return function(stack, spec) {
    var svc = {
      id: "",
      stack: stack.key,
      service: spec.key,
      status: "",
      resourceLimits: angular.copy(spec.resourceLimits),
      depends: angular.copy(spec.depends),
      config: angular.copy(spec.config),
      volumes: angular.copy(spec.volumeMounts),
      ports: angular.copy(spec.ports)
    };
    
    // Assign default values (for "Use Default" option)
    angular.forEach(svc.config, function(cfg) {
      if (cfg.isPassword) {
        cfg.value = RandomPassword.generate();
      }
    });
    
    return svc;
  };
}])

/**
 * A shared storage wrapper for all data pulled from the server
 */
.factory('ServerData', [ '$log', '$q', 'Specs', 'Stacks', 'Project', 'Vocabulary', function($log, $q, Specs, Stacks,  Project, Vocabulary) {
  "use strict";

  var data = {
    /**
     * Purges all shared data from the server
     */
    purgeAll: function() {
      Specs.purge();
      Project.purge();
      Stacks.purge();
      Vocabulary.purge();
    },
      
    /**
     * Populate all shared data from the server into our scope
     */
    populateAll: function(projectId) {
      return Vocabulary.populate("tags").then(function() {
        Specs.populate().then(function() {
          Project.populate(projectId).then(function() {
            Stacks.populate(projectId);
          });
        });
      });
    },
    specs: Specs,
    stacks: Stacks,
    vocab: Vocabulary,
    project: Project
  };
  
  return data;
}])

/** Helper service for navigating to a link (by default, this will open a new tab)  */
.factory('Popup', [ '$window', 'PopupChecker', function($window, PopupChecker) {
  "use strict";
  
  return {
    open: function(url, target) {
      var popup = $window.open(url, target || "_blank");
      PopupChecker.check(popup);
    }
  };
}])

/** Helper service for checking if the user has enabled their browser's popup blocker */
.factory('PopupChecker', [ function() {
  "use strict";
  
  var popupBlockerChecker = {
    check: function(popup_window){
      var _scope = this;
      if (popup_window) {
        // TODO: Look into other browser support here?
        if(/chrome/.test(navigator.userAgent.toLowerCase())){
            setTimeout(function () {
                _scope._is_popup_blocked(_scope, popup_window);
             }, 200);
        } else {
            popup_window.onload = function () {
                _scope._is_popup_blocked(_scope, popup_window);
            };
        }
      } else {
          _scope._displayError();
      }
    },
    _is_popup_blocked: function(scope, popup_window){
        if ((popup_window.innerHeight > 0) === false) {
          scope._displayError(); 
        }
    },
    _displayError: function(){
        alert("Popup Blocker is enabled! Please add this site to your exception list.");
    }
  };
  
  return popupBlockerChecker;
}]);
