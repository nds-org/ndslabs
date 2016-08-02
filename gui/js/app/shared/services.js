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

.factory('SoftRefresh', [ 'Stacks', 'Project', 'Specs', function(Stacks, Project, Specs) {
 var refresh = {
    /**
     * Perform a partial "soft-refresh" - refresh the stack data without fully re-rendering the page
     */ 
   stacks: function() {
    Stacks.populate(Project.project.namespace);
   },
    /**
     * Perform a full "soft-refresh" - refresh all data without fully re-rendering the page
     */ 
   full: function() {
    Specs.populate();
    Project.populate(Project.project.namespace).then(function() {
      refresh.stacks();
    });
   }
 }
 
 return refresh;
}])

.factory('AutoRefresh', [ '$interval', '$log', 'SoftRefresh', function($interval, $log, SoftRefresh) {
  var autoRefresh = {
    interval: null,
    onInterval: SoftRefresh.stacks,
    periodSeconds: 1,
    start: function () {
      autoRefresh.stop();
      autoRefresh.interval = $interval(autoRefresh.onInterval, 1000 * autoRefresh.periodSeconds);
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
.factory('Project', [ '$log', 'NdsLabsApi', function($log, NdsLabsApi) {
  var project = {
    purge: function() {
      project.project = {};
    },
    // Grab the project associated with our current namespace
    populate: function(projectId) {
      return NdsLabsApi.getAccountsByAccountId({ 
        "accountId": projectId 
      }).then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "!");
        return project.project = data;
      }, function(headers) {
        $log.debug("error!");
      });
    },
    // An empty place-holder for our project data
    project: {}
  };
    
  return project;
}])

/**
 * A shared store for service specs pulled from /services
 */
.factory('Specs', [ '$log', '_', 'Vocabulary', 'NdsLabsApi', function($log, _, Vocabulary, NdsLabsApi) {
  // An empty place-holder for our service/stack specs
  var specs = {
    purge: function() {
      specs.all = specs.stacks = specs.deps = [];
    },
    /**
     * Grab the current site's available services
     */ 
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
        
        var devEnvTag = _.find(Vocabulary.all.terms, ['name', 'Development environment']);
        specs.devEnvs = _.filter(data, function(spec) {
          return spec.tags && spec.tags.indexOf(devEnvTag.id) !== -1;
        });
        
        return data;
      }, function (headers) {
        $log.error("error grabbing from /services!");
      });
    },
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
  // An empty place-holder for our deployed stacks
  var stacks = {
    purge: function() {
      stacks.all = [];
    },
     /**
      * Grab the list of configured stacks in our project
      */
    populate: function(projectId) {
      return NdsLabsApi.getStacks().then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "/stacks!");
        
        return stacks.all = data || [];
      }, function(headers) {
        $log.error("error grabbing from /projects/" + projectId + "/stacks!");
      });
    },
    all: []
  };
  
  return stacks;
}])

/**
 * A shared store for stacks pulled from /projects/{namespace}/stacks
 */
.factory('Vocabulary', [ '$log', 'NdsLabsApi', function($log, NdsLabsApi) {
  // An empty place-holder for our deployed stacks
  var vocab = {
    purge: function() {
      vocab.all = [];
    },
     /**
      * Grab the list of configured stacks in our project
      */
    populate: function(name) {
      return NdsLabsApi.getVocabularyByVocabName({ vocabName: name }).then(function(data, xhr) {
        $log.debug("successfully grabbed vacob list for " + name + "!");
        
        return vocab.all = data || [];
      }, function(response) {
        $log.error("error grabbing vocab list!");
      });
    },
    all: []
  };
  
  return vocab;
}])

/**
 * Represents a spec.
 * @constructor
 */
.service('Spec', [ '$log', 'Specs', '_', function($log, Specs, _) {
  return function() {
    
      return {
      "id": "",
      "key": "",
      "label": "",
      "description": "",
      "logo": "",
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
          "path": '',
          "port": 80,
          "initialDelay": 15,
          "timeout":45,
        },
      "developerEnvironment": "",
      "tags": []
    };
  }
}])

/**
 * Represents a stack.
 * @constructor
 * @param {} spec - The service spec from which to create the stack
 */
.service('Stack', [ '$log', 'Specs', 'StackService', '_', function($log, Specs, StackService, _) {
  return function(spec) {
    var key = spec.key;
            
    var stack = {
      id: "",
      name: key,
      key: key,
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
.service('StackService', [ function() {
  return function(stack, spec) {
    var svc = {
      id: "",
      stack: stack.key,
      service: spec.key,
      status: "",
      depends: angular.copy(spec.depends),
      config: angular.copy(spec.config),
      volumes: angular.copy(spec.volumeMounts),
      ports: angular.copy(spec.ports)
    };
    
    // Assign default values (for "Use Default" option)
    angular.forEach(svc.config, function(cfg) {
      if (cfg.isPassword) {
        cfg.value = 'GENERATED_PASSWORD';
      }
    });
    
    return svc;
  };
}])

/**
 * 
 */
.factory('ServerData', [ '$log', '$q', 'Specs', 'Stacks', 'Project', 'Vocabulary', function($log, $q, Specs, Stacks,  Project, Vocabulary) {
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
            Stacks.populate();
          })
        })
      });
    },
    specs: Specs,
    stacks: Stacks,
    vocab: Vocabulary,
    project: Project
  };
  
  return data;
}]);