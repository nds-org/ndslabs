/* global angular:false */

/**
 * This file defines shared data structures and constructors.
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/Services+and+Factories
 */
angular.module('ndslabs-services', [])

/**
 * Make lodash available for injection into services
 */ 
.constant('_', window._)

/**
 * A shared store for our project metadata pulled from /projects/{namespace}
 */
.factory('Project', [ function() {
  // An empty place-holder for our project data
  return {};
}])

/**
 * A shared store for service specs pulled from /services
 */
.factory('Specs', [ function(i) {
  // An empty place-holder for our service/stack specs
  var specs = {
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
.factory('Stacks', [ function() {
  // An empty place-holder for our deployed stacks
  return {
    all: [],
    configured: [],
    deployed: []
  };
}])

/**
 * A shared store for volumes pulled from /projects/{namespace}/volumes
 */
.factory('Volumes', [ function() {
  // An empty place-holder for our volumes
  return {
    all: [],
    attached: [],
    orphans: []
  };
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
}])


/**
 * Abstracted logic for discovering service requirements.
 */
.factory('ServiceDiscovery', [ '_', 'Specs', 'Volumes', 'Volume', function(_, Specs, Volumes, Volume) {
  var factory = {
    discoverConfigRequirements: function(stack) {
      var config = {};
      angular.forEach(stack.services, function(svc) {
        var spec = _.find(Specs.all, [ 'key', svc.service ]);
        
        // Don't modify specs in-place... make a copy
        if (spec.config) {
          config[svc.service] = {
            list: angular.copy(spec.config),
            defaults: angular.copy(spec.config)
          };
        }
      });
      
      return config;
    },
    discoverOrphanVolumes: function(stack) {
      var orphanVolumes = [];
      
      angular.forEach(stack.services, function(requestedSvc) {
        var svcSpec = _.find(Specs.all, function(svc) { return svc.key === requestedSvc.service });
        
        // TODO: Gross hack.. fix this
        if (svcSpec.volumeMounts && _.filter(svcSpec.volumeMounts, function(mnt) {
          return mnt.name !== 'docker';
        }).length > 0) {
          var orphan = null;
          angular.forEach(Volumes.all, function(volume) {
            if (!volume.attached && svcSpec.key === volume.service) {
              // This is an orphaned volume from this service... Prompt the user to reuse it
              orphan = volume;
              orphanVolumes.push(orphan);
            }
          });
        }
      });
      
      return orphanVolumes;
    },
    discoverRequiredVolumes: function(stack) {
      var requiredVolumes = [];
      
      angular.forEach(stack.services, function(requestedSvc) {
        var svcSpec = _.find(Specs.all, function(svc) { return svc.key === requestedSvc.service });
        
        // TODO: Gross hack.. fix this
        if (svcSpec.volumeMounts && _.filter(svcSpec.volumeMounts, function(mnt) {
          return mnt.name !== 'docker';
        }).length > 0) {
          requiredVolumes.push(new Volume(stack, svcSpec));
        }
      });
      
      return requiredVolumes;
    }
  };
  
  return factory;
}])
;