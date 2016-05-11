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

.factory('SoftRefresh', [ 'Stacks', 'Volumes', 'Project', 'Specs', function(Stacks, Volumes, Project, Specs) {
 var refresh = {
   stacks: function() {
    Stacks.populate(Project.project.namespace);
   },
    /**
     * Perform a partial "soft-refresh" - refresh the stack/volume data without fully re-rendering the page
     */ 
   partial: function() {
    Stacks.populate(Project.project.namespace);
    Volumes.populate(Project.project.namespace);
   },
    /**
     * Perform a full "soft-refresh" - refresh all data without fully re-rendering the page
     */ 
   full: function() {
    Specs.populate();
    Project.populate(Project.project.namespace).then(function() {
      refresh.partial();
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
      return NdsLabsApi.getProjectsByProjectId({ 
        "projectId": projectId 
      }).then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "!");
        project.project = data;
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
.factory('Specs', [ '$log', '_', 'NdsLabsApi', function($log, _, NdsLabsApi) {
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
      return NdsLabsApi.getServices().then(function(data, xhr) {
        $log.debug("successfully grabbed from /services!");
        specs.all = angular.copy(data);
        specs.deps = angular.copy(data);
        specs.stacks = _.remove(specs.deps, function(svc) { return svc.stack === true; });
      }, function (headers) {
        $log.error("error grabbing from /services!");
      });
    },
    all: [],
    stacks: [],
    deps: []
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
      return NdsLabsApi.getProjectsByProjectIdStacks({ 
        "projectId": projectId 
      }).then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "/stacks!");
        
        stacks.all = data || [];
      }, function(headers) {
        $log.error("error grabbing from /projects/" + projectId + "/stacks!");
      });
    },
    all: []
  };
  
  return stacks;
}])

/**
 * A shared store for volumes pulled from /projects/{namespace}/volumes
 */
.factory('Volumes', [ '$log', '_', 'NdsLabsApi', function($log, _, NdsLabsApi) {
  var volumes = {
    purge: function() {
      volumes.all = volumes.orphans = volumes.attached = [];
    },
    /**
     * Grab the list of configured volumes in our project
     */ 
    populate: function(projectId) {
      // Grab the list of configured volumes in our namespace
      return NdsLabsApi.getProjectsByProjectIdVolumes({ 
        "projectId": projectId
      }).then(function(data, xhr) {
        $log.debug("successfully grabbed from /projects/" + projectId + "/volumes!");
        
        volumes.all = angular.copy(data) || [];
        volumes.orphans = _.remove(volumes.orphans, [ 'serviceId', null]);
        volumes.attached = angular.copy(data) || [];
      }, function(headers) {
        $log.error("error grabbing from /projects/" + projectId + "/volumes!");
      });
    }, 
    all: [],
    attached: [],
    orphans: []
  };
  
  return volumes;
}])

/**
 * Represents a stack.
 * @constructor
 * @param {} spec - The service spec from which to create the stack
 */
.service('Stack', [ 'Stacks', '_', function(Stacks, _) {
  return function(spec) {
    var key = spec.key;
    
    var stack = {
      id: "",
      name: key,
      key: key,
      status: "Suspended",
      services: []
    };
    
    return stack;
  };
}])

/**
 * Represents a volume.
 * @constructor
 * @param {} stack - The stack of the attached service -- TODO: unused
 * @param {} service - The service to attach to this volume
 */
.service('Volume', [ 'Volumes', '_', function(Volumes, _) {
  return function(stack, service) { 
    var key = service.key;
    
    var volume = {
      id: '',
      defaultName: key,   // This is used only in the UI
      name: key,
      size: 1,
      sizeUnit: 'GB',
      format: 'Raw',
      attached: service.id,
      service: key,
      status: '',
      formatted: false
    };
    
    return volume;
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
      status: ""
    };
    
    return svc;
  };
}])

/**
 * 
 */
.factory('ServerData', [ '$log', '$q', 'Specs', 'Stacks', 'Volumes', 'Project', function($log, $q, Specs, Stacks, Volumes, Project) {
  var data = {
    /**
     * Purges all shared data from the server
     */
    purgeAll: function() {
      Specs.purge();
      Project.purge();
      Stacks.purge();
      Volumes.purge();
    },
      
    /**
     * Populate all shared data from the server into our scope
     */
    populateAll: function(projectId) {
      return $q.all([
        Specs.populate(),
        Project.populate(projectId),
        Stacks.populate(projectId),
        Volumes.populate(projectId)
      ]);
    },
    specs: Specs,
    stacks: Stacks,
    volumes: Volumes,
    project: Project
  };
  
  return data;
}])

/**
 * Abstracted logic for discovering service requirements.
 */
.factory('ServiceDiscovery', [ '_', 'Specs', 'Volumes', 'Volume', function(_, Specs, Volumes, Volume) {
  var factory = {
    discoverConfigRequirements: function(stack) {
      var configs = {};
      angular.forEach(stack.services, function(svc) {
        var svcConfig = factory.discoverConfigSingle(svc.service);
        if (svcConfig) {
          _.merge(configs, svcConfig);
        }
      });
      
      return configs;
    },
    discoverConfigSingle: function(key) {
      var spec = _.find(Specs.all, [ 'key', key ]);
      var ret = {};
      var svcConfig = {
        list: [],  
        defaults: []
      };
      
      // Don't modify specs in-place... make a copy
      if (spec.config) {
        svcConfig.list = angular.copy(spec.config) || [];
        svcConfig.defaults = angular.copy(spec.config) || [];
        ret[key] = svcConfig;
      }
      
      return ret;
    },
    discoverOrphanVolumes: function(stack) {
      var orphanVolumes = [];
      
      angular.forEach(stack.services, function(requestedSvc) {
        var key = requestedSvc.service;
        var orphans = factory.discoverOrphansSingle(key);
        orphanVolumes = _.concat(orphanVolumes, orphans);
      });
      
      return orphanVolumes;
    },
    discoverOrphansSingle: function(key) {
      // Grab all orphaned volumes from this service to prompt the user to reuse it
      return _.filter(Volumes.all, function(volume) {
        if (!volume.attached && key === volume.service) {
          return volume;
        }
      });
    },
    discoverRequiredVolumes: function(stack) {
      var requiredVolumes = [];
      
      angular.forEach(stack.services, function(requestedSvc) {
        var key = requestedSvc.service;
        var required = factory.discoverRequiredSingle(stack, key);
        if (required !== null) {
          requiredVolumes.push(required);
        }
      });
      
      return requiredVolumes;
    },
    discoverRequiredSingle: function(stack, key) {
      var svcSpec = _.find(Specs.all, function(svc) { return svc.key === key });
        
      if (!svcSpec.volumeMounts) {
        return null;
      }  
      
      // Ignore docker mount
      var mounts = _.filter(svcSpec.volumeMounts, function(mnt) {
        return mnt.name !== 'docker';
      });
      
      // If any non-docker mounts exist, return an empty Volume object for them
      if (mounts.length > 0) {
        return new Volume(stack, svcSpec);
      }
    }
  };
  
  return factory;
}]);