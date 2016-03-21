/* global angular:false */

/**
 * This file defines filters that attach to bindings in 
 * partial view templates and return a custom transformation
 * of their input.
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/Filters
 */
angular.module('ndslabs-filters', [ 'ndslabs-services' ])

/**
 * Make lodash available for injection into filters
 */ 
.constant('_', window._)

/**
 * Given a string, capitalize it
 */ 
.filter('capitalize', [ '_', function(_) {
  return function(input) {
    return _.capitalize(input);
  };
}])
/**
 * Given a string, encode it so that it can be safely put into a URL
 */
.filter('urlEncode', [ '_', function(_) {
  return function(input) {
    if(input) {
      return window.encodeURIComponent(_.replace(input, '\s', '+')); 
    }
    return "";
  }
}])
/**
 * Given a string, decode it safely from URL form
 */
.filter('urlDecode', [ function() {
  return function(input) {
    if(input) {
      return window.decodeURIComponent(input); 
    }
    return "";
  }
}])
/**
 * Given an array of specs, return only those which can be added to your namespace.
 */
.filter('isStack', [ '_', function(_) {
  return function(input, showStandalones) {
    if (!showStandalones) {
      return _.filter(input, ['isStack', true]);
    }
    
    return _.filter(input, { 'isStandalone': true });
  }
}])
/**
 * Given a stack, return a list of ALL of its services' endpoints
 */
.filter('allEndpoints', ['_', function(_) {
  return function(stack) {
    var endpoints = [];
    angular.forEach(stack.services, function(svc) {
      endpoints = _.concat(endpoints, svc.endpoints);
    });
    return endpoints;
  };
}])
/**
 * Given a list of configs, return true iff at least one of them can be overridden
 */
.filter('mustOverrideAny', ['_', 'Specs', function(_, Specs) {
  return function(configs) {
    if (angular.isArray(configs)) {
      return _.find(configs, { 'canOverride': true, 'value':'' });
    } else if (angular.isObject(configs)) {
      var mustOverride = false;
      if (configs.list && configs.list.length > 0) {
        configs = configs.list
      }
      angular.forEach(configs, function(configList, svc) {
        if (_.find(configs, { 'canOverride': true, 'value':'' })) {
          mustOverride = true;
        }
      });
      return mustOverride;
    } else {
      return false;
    }
  };
}])
/**
 * Given a list of configs, return true iff at least one of them can be overridden
 */
.filter('canOverrideAny', ['_', 'Specs', function(_, Specs) {
  return function(configs) {
    if (angular.isArray(configs)) {
      return _.find(configs, [ 'canOverride', true ]);
    } else if (angular.isObject(configs)) {
      var canOverride = false;
      if (configs.list && configs.list.length > 0) {
        configs = configs.list
      }
      angular.forEach(configs, function(configList, svc) {
        if (_.find(configs, [ 'canOverride', true ])) {
          canOverride = true;
        }
      });
      return canOverride;
    } else {
      return false;
    }
  };
}])
/**
 * Given a spec key and a config name, return its default value
 */
.filter('defaultValue', ['_', 'Specs', function(_, Specs) {
  return function(configName, specKey) {
    var spec = _.find(Specs.all, ['key', specKey ]);
    
    if (!spec) {
      return '';
    }
    
    return _.find(spec.config, ['name', configName ]).value;
  };
}])
/**
 * Given a service spec key, retrieve its label
 */
.filter('specProperty', ['$log', 'Specs', '_', function($log, Specs, _) {
  return function(key, propertyName) {
    if (!key || !propertyName) {
      return '';
    }
    
    var spec = _.find(Specs.all, [ 'key', key ]);
    if (!spec) {
      $log.error('Spec not found: ' + key);
      return '';
    }
    
    if (!angular.isDefined(spec[propertyName])) {
      $log.error('Property not found: ' + propertyName);
      debugger;
      return '';
    }
    
    return spec[propertyName];
  };
}])
/**
 * Given a stack id, retrieve the given property of the stack
 */
.filter('stackProperty', ['Stacks', '_', function(Stacks, _) {
  return function(key, propertyName, serviceProperty) {
    // Generic "find" that utilizes our hierarchical id scheme
    var stack = _.find(Stacks.all, function(stk) {
      if (key.indexOf(stk.id) !== -1) {
        return stk;
      }
    });
    
    if (!stack) {
      return '';
    }
    
    // If this is a stack property, return it.. if not, drill down to services
    if (!serviceProperty) {
      return stack[propertyName];
    }
    
    var svc = _.find(stack.services, ['id', key ]);
    return svc[propertyName];
  };
}])
/**
 * Given a stack service id, retrieve attached volumes for the service
 */
.filter('stackSvcVolumes', ['Volumes', '_', function(Volumes, _) {
  return function(svcId) {
    if (!svcId) {
      return [];
    }
    var volumes = _.filter(Volumes.all, [ 'attached', svcId ]);
    return volumes;
  };
}])
/**
 * Given a stack id, retrieve attached volumes for the entire stack
 */
.filter('stackVolumes', ['Stacks', 'Volumes', '_', function(Stacks, Volumes, _) {
  return function(stackId) {
    var stack = _.filter(Stacks.all, [ 'id', stackId ]);
    
    if (!stack) {
      return [];
    }
    
    var volumes = [];
    angular.forEach(stack.services, function(svc) {
      _.concat(volumes, _.filter(Volumes.all, [ 'attached', svc.id ]));
    });
    return volumes;
  };
}])
/**
 * Given a list of volumes, compute the total storage they are using
 */
.filter('usedStorage', [ function() {
  return function(volumes) {
    var used = 0;
    angular.forEach(volumes, function(volume) {
      used += volume.sizeUnit === 'TB' ? volume.size * 1000 : volume.size;
    });
    return used;
  };
}])
/**
 * Given a list of volumes, compute the total storage they are using
 */
.filter('availableStorage', [ 'Project', function(Project) {
  return function(volumes) {
    var available = Project.project.storageQuota || 50;
    angular.forEach(volumes, function(volume) {
      available -= volume.sizeUnit === 'TB' ? volume.size * 1000 : volume.size;
    });
    return available;
  };
}])
/**
 * Given a list of stacks, count how many are running
 */
.filter('runningStacksCount', [ function() {
  return function(stacks) {
    var running = 0;
    angular.forEach(stacks, function(stack) {
      if (stack.status !== 'stopped') {
        running++;
      }
    });
    return running;
  };
}])
/**
 * Given a list of services and a target service, check the list of 
 * services to see if our target service is a required dependency
 * of any of the others
 */ 
.filter('isRecursivelyRequired', [ 'Specs', function(Specs) {
  return function(services, service) {
    var result = false;
    angular.forEach(services, function(svc) {
      var spec = _.find(Specs.all, { 'key': svc.service });
      if (spec) {
        var dep = _.find(spec.depends, _.matchesProperty('key', service.service));
        if (dep && dep.required === true) {
          result = true;
        }
      }
    });
    return result;
  };
}])
/**
 * Returns true iff the given stack has missing options that the user can enable
 */ 
.filter('missingDeps', [ '$log', 'Specs', function($log, Specs) {
  // Returns any options missing from a stack
  return function(stack) {
    if (!Specs.all || !Specs.all.length) {
      return [];
    }
    
    var spec = _.find(Specs.all, ['key', stack.key]);
    if (spec) {
      var options = _.filter(angular.copy(spec.depends), [ 'required', false ]);
      var missing = [];
      angular.forEach(options, function(op) {
        if (!_.find(stack.services, [ 'service', op.key ])) {
          missing.push(op);
        }
      });
      return missing;
    } else {
      $log.error("Cannot locate missing optional dependencies - key not found: " + stack.key);
    }
    return false;
  };
}])
/**
 * Given a service spec key, list all optional dependencies for the spec
 */ 
.filter('options', [ '$log', 'Specs', function($log, Specs) {
  // Returns a list of options for a spec
  return function(key) {
    if (!Specs.all || !Specs.all.length) {
      return [];
    }
    
    var spec = _.find(Specs.all, ['key', key]);
    if (spec) {
      var options = _.filter(spec.depends, [ 'required', false ]);
      return options;
    } else {
      $log.error("Cannot locate options - key not found: " + key);
    }
    return [];
  };
}])
/**
 * Given a service spec key, list all required dependencies for the spec
 */ 
.filter('requirements', [ '$log', '_', 'Specs', function($log, _, Specs) {
  // Return a list of requirements for a spec
  return function(key) {
    if (!Specs.all || !Specs.all.length) {
      return [];
    }
    
    var spec = _.find(Specs.all, ['key', key]);
    if (spec) {
      var requirements = _.filter(spec.depends, [ 'required', true ]);
      return requirements;
    } else {
      $log.error("Cannot locate requirements - key not found: " + key);
    }
    return [];
  };
}])
/**
 * Given a list of dependencies, format them and output 
 * a comma-separated string of their labels
 */
.filter('formatDependencies', [ '_', 'Specs', function(_, Specs) {
  return function(deps) {
    var getLabel = function(specKey) {
      return _.find(Specs.all, [ 'key', specKey]).label;
    }
    
    var ret = '';
    switch(deps.length) {
      case 0:
        return '';
      case 1:
        return getLabel(deps[0]);
      case 2:
        return getLabel(deps[0]) + ' and ' + getLabel(deps[1]);
      default:
        angular.forEach(_.slice(deps, 1), function(dep) {
          if (deps.indexOf(dep) === deps.length) {
            ret += ', and ' + getLabel(dep);
          } else {
            ret += ', ' + getLabel(dep);
          }
        });
        return ret;
    }
  };
}])
/**
 * Given a list of orphaned volumes and a service name,
 * return any orphans matching that service
 */ 
.filter('orphansExist', function() {
  return function(orphans, service) {
    var matches = [];
    angular.forEach(orphans, function(orphan) {
      if (orphan.service === service) {
        matches.push(orphan);
      }
    });
    return matches;
  };
});