/**
 * This file defines shared data structures and constructors.
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/Services+and+Factories
 */
angular.module('ndslabs')

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
.service('Stack', [ 'Stacks', function(Stacks) {
  return function(spec) {
    var stack = {
      id: "",
      name: "",
      key: spec.key,
      status: "Suspended",
      services: []
    };
    
    // TODO: Manage this automatically? Seems like a bad idea...
    //Stacks.all.push(stack);
    
    return stack;
  };
}])

/**
 * Represents a volume.
 * @constructor
 * @param {} stack - The stack of the attached service
 * @param {} service - The service to attach to this volume
 */
.service('Volume', [ 'Volumes', function(Volumes) {
  return function(stack, service) { 
    var volume = {
      id: '',
      key: service.key,
      stack: stack.name,
      service: service.key,
      format: 'Raw',
      size: 10,
      sizeUnit: 'GB',
      attached: service.id
    };
    
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
      replicas: 1,
      endpoints: []
    };
    
    //stack.services.push(svc);
    
    return svc;
  };
}]);