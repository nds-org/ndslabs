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
 * Given a password strength (1 - 100), return an apprpriate label
 * TODO: Replace this with i18n / i10n??
 */
.filter('passwordStrength', function() {
  return function(strength) {
    if (strength < 15) { 
      return 'Weak...'; 
    } else if (strength <= 50) {
      return 'OK';
    } else if (strength <= 84) {
      return 'Good!';
    } else {
      return 'Strong!!!'
    }
  }
})

/**
 * Return the external IP of the API / GUI server 
 * appended with the port if one is provided.
 */ 
.filter('externalHostPort', [ 'ApiHost', 'ApiPort', '_', function(ApiHost, ApiPort, _) {
  return function(endpt) {
    // TODO: How do we know if this can be navigated to?
    var protocol = endpt.protocol;

	// NDS-260
    if (endpt.host) {
        return protocol + '://' + endpt.host;
    } else {
       return protocol + '://' + ApiHost + (endpt.nodePort ? ':' + endpt.nodePort : '');
    }
  };
}])

/**
 * Given an array of specs, return only those which can be added to your namespace.
 */
.filter('isStack', [ '_', function(_) {
  return function(input, showStandalones) {
    if (!showStandalones) {
      return _.filter(input, ['display', 'stack']);
    }

    // Return stacks and standalones
    return _.filter(input, function(o) {
      return o.display;
    }); 
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
 * Given a service spec key, retrieve its label
 */
.filter('specProperty', ['$log', 'Specs', '_', function($log, Specs, _) {
  return function(key, propertyName) {
    if (!key || !propertyName) {
      return '';
    }
    
    var spec = _.find(Specs.all, [ 'key', key ]);
    if (!spec) {
      $log.debug('Spec not found: ' + key);
      return '';
    }
    
    if (!angular.isDefined(spec[propertyName])) {
      $log.debug('Property not found: ' + propertyName);
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
.filter('isRecursivelyRequired', [ 'Specs', '_', function(Specs, _) {
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
 * Given a service spec key, list all optional dependencies for the spec
 */ 
.filter('options', [ '$log', 'Specs', '_', function($log, Specs, _) {
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
}]);
