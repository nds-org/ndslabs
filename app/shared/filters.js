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

.filter('countReqConfigs', [ '_', function(_) {
  "use strict";

  return function(input) {
    var ret = [];
    
    angular.forEach(input, function(cfg) {
      if (cfg.isPassword || cfg.canOverride) {
        ret.push(cfg);
      }
    }); 
    
    return ret.length;
  };
}])


.filter('countReqVolumes', [ '_', function(_) {
  "use strict";

  return function(input) {
    var ret = [];
    
    angular.forEach(input, function(vol) {
      if (!vol.canEdit) {
        ret.push(vol);
      }
    }); 
    
    return ret.length;
  };
}])

/**
 * Given a list of specs, return only those associated with the given tag name
 */ 
.filter('hasTag', [ '_', 'Vocabulary', function(_, Vocabulary) {
  "use strict";

  return function(input, tagName) {
    var tag = _.find(Vocabulary.all.terms, ['name', tagName]);
    
    if (!tag || !tag.id) {
      return '';
    }
    
    return _.filter(input, function(spec) {
      return spec.tags && spec.tags.indexOf(tag.id) !== -1;
    });
  };
}])

/**
 * Given a list of option and a stack, return only option which have not yet been added to the stack
 */ 
.filter('notPresent', [ '_', function(_) {
  "use strict";

  return function(input, stack) {
    if (!stack || !stack.key) {
      return [];
    }
    
    var ret = [];
    
    angular.forEach(input, function(option) {
      var item = _.find(stack.services, [ 'service', option.key ]);
      if (!item) {
        ret.push(option);
      }
    });
    
    return ret;
  };
}])


/**
 * Given a string, capitalize each term (separated by whitespace)
 */ 
.filter('capitalize', [ '_', function(_) {
  "use strict";

  return function(input) {
    var ret = [];
    angular.forEach(_.split(input, /\s/), function(term) {
      ret.push(_.capitalize(term));
    });
    return _.join(ret, " ");
  };
}])

/**
 * Given a list of applications and a list of tags, return only 
 * the services with one or more of those tags
 */
.filter('showTags', [ '_', function(_) {
  "use strict";

  return function(input, tags) {
    if (!tags || tags.length === 0) {
      return input;
    }
    
    var ret = _.filter(input, function(spec) {
      return _.every(tags, function(tag) {
        if (tag.id) {
          if (!spec.tags) {
            return false;
          }
          return spec.tags.indexOf(tag.id) !== -1;
        } else {
          var json = JSON.stringify(spec);
          return _.includes(json.toLowerCase(), tag.name);
        }
      });
    });
    
    return ret;
  };
}])

/**
 * Given a password strength (1 - 100), return an apprpriate label
 * TODO: Replace this with i18n / i10n??
 */
.filter('passwordStrength', function() {
  "use strict";

  return function(strength) {
    if (strength < 15) { 
      return 'Weak...'; 
    } else if (strength <= 50) {
      return 'OK';
    } else if (strength <= 84) {
      return 'Good!';
    } else {
      return 'Strong!!!';
    }
  };
})

/**
 * Return the external IP of the API / GUI server 
 * appended with the port if one is provided.
 */ 
.filter('externalHostPort', [ 'ApiSecure', 'ApiHost', 'ApiPort', '_', function(ApiSecure, ApiHost, ApiPort, _) {
  "use strict";

  return function(endpt) {
    // TODO: How do we know if this can be navigated to?
    var protocol = 'http' + (ApiSecure ? 's' : '');
    
	  // NDS-260
    if (endpt.url) {
      return protocol + '://' + endpt.url;
    } else {
      return protocol + '://' + ApiHost + (endpt.nodePort ? ':' + endpt.nodePort : '');
    }
  };
}])

/**
 * Given an array of specs, return only those which can be added to your namespace.
 */
.filter('display', [ '_', function(_) {
  "use strict";

  return function(input) {
    // Return stacks and standalones
    return _.filter(input, function(o) {
      return o.display && o.display !== 'none';
    }); 
  };
}])
/**
 * Given a stack, return a list of ALL of its services' endpoints
 */
.filter('allEndpoints', ['_', function(_) {
  "use strict";

  return function(stack) {
    var endpoints = [];
    angular.forEach(stack.services, function(svc) {
      endpoints = _.concat(endpoints, svc.endpoints);
    });
    return endpoints;
  };
}])

/**
 * Given a tag id, retrieve the given property
 */
.filter('tagProperty', ['$log', 'Vocabulary', '_', function($log, Vocabulary, _) {
  "use strict";

  return function(tagId, propertyName) {
    if (!tagId) {
      return '';
    }
    
    propertyName = propertyName || 'name';
    var tag = _.find(Vocabulary.all.terms, [ 'id', tagId ]);
    if (!tag || !angular.isDefined(tag[propertyName])) {
      return '';
    }
    
    return tag[propertyName];
  };
}])

/**
 * Given a service spec key, retrieve its label
 */
.filter('specProperty', ['$log', 'Specs', '_', function($log, Specs, _) {
  "use strict";

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
  "use strict";

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
  "use strict";

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
  "use strict";

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
  "use strict";

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
  "use strict";

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
