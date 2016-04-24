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
    onInterval: SoftRefresh.partial,
    periodSeconds: 2,
    start: function () {
      autoRefresh.stop();
      autoRefresh.interval = $interval(autoRefresh.onInterval, 1000 * autoRefresh.periodSeconds);
      $log.debug("Interval starting: " + autoRefresh.interval);
    },
    stop: function() {
      if (autoRefresh.interval !== null) {
        while (!$interval.cancel(autoRefresh.interval)) { /* NOOP */ }
        autoRefresh.interval = null;
      }
      $log.debug("Interval stopped: " + autoRefresh.interval);
      
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
    var counts= _.countBy(Stacks.all, 'key');
    var count = (++counts[spec.key]) || 1;
    
    if (count < 10) {
      count = '0' + count;
    }
    
    var name = spec.label.slice(0,12) + "-" + count;
    
    var stack = {
      id: "",
      name: name,
      key: spec.key,
      status: "Suspended",
      services: [],
  //    createdTime: new Date(),
 //     updateTime: new Date()
    };
    
    // TODO: Manage this automatically? Seems like a bad idea...
    //Stacks.all.push(stack);
    
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
    var counts = _.countBy(Volumes.all, 'service');
    var count = (++counts[service.key]) || '1';
    
    if (count < 10) {
      count = '0' + count;
    }
    
    var name = service.key.slice(0,12) + '-' + count;
    
    var volume = {
      id: '',
      defaultName: name,
      size: 5,
      sizeUnit: 'GB',
      format: 'Raw',
      attached: service.id,
      service: service.key,
      status: '',
      formatted: false,
  //    createdTime: new Date(),
  //    updateTime: new Date()
    };
    
    // Initially set our name ot the suggested default
    volume.name = volume.defaultName;
    
    // TODO: Manage this automatically? Seems like a bad idea...
    //Volumes.all.push(volume);
    
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
      status: "",
   //   createdTime: new Date(),
   //   updatedTime: new Date()
      //replicas: 1,
      //endpoints: []
    };
    
    //stack.services.push(svc);
    
    return svc;
  };
}]);