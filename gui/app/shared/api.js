/*jshint -W069 */
/*global angular:false */
angular.module('ndslabs-api', [])
    .factory('ApiServer', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {
        'use strict';

        /**
         * API for the NDS Labs Workbench service
         * @class ApiServer
         * @param {(string|object)} [domainOrOptions] - The project domain or options object. If object, see the object's optional properties.
         * @param {string} [domainOrOptions.domain] - The project domain
         * @param {string} [domainOrOptions.cache] - An angularjs cache implementation
         * @param {object} [domainOrOptions.token] - auth token - object with value property and optional headerOrQueryName and isQuery properties
         * @param {string} [cache] - An angularjs cache implementation
         */
        var ApiServer = (function() {
            function ApiServer(options, cache) {
                var domain = (typeof options === 'object') ? options.domain : options;
                this.domain = typeof(domain) === 'string' ? domain : '';
                if (this.domain.length === 0) {
                    throw new Error('Domain parameter must be specified as a string.');
                }
                cache = cache || ((typeof options === 'object') ? options.cache : cache);
                this.cache = cache;
            }

            ApiServer.prototype.request = function(method, url, parameters, body, headers, queryParameters, form, deferred) {
                var options = {
                    timeout: parameters.$timeout,
                    method: method,
                    url: url,
                    params: queryParameters,
                    data: body,
                    headers: headers
                };
                if (Object.keys(form).length > 0) {
                    options.data = form;
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    options.transformRequest = ApiServer.transformRequest;
                }
                $http(options)
                    .success(function(data, status, headers, config) {
                        deferred.resolve(data);
                        if (parameters.$cache !== undefined) {
                            parameters.$cache.put(url, data, parameters.$cacheItemOpts ? parameters.$cacheItemOpts : {});
                        }
                    })
                    .error(function(data, status, headers, config) {
                        deferred.reject({
                            status: status,
                            headers: headers,
                            config: config,
                            body: data
                        });
                    });

            };

            ApiServer.prototype.$on = function($scope, path, handler) {
                var url = this.domain + path;
                $scope.$on(url, function() {
                    handler();
                });
                return this;
            };

            ApiServer.prototype.$broadcast = function(path) {
                var url = this.domain + path;
                //cache.remove(url);
                $rootScope.$broadcast(url);
                return this;
            };

            ApiServer.transformRequest = function(obj) {
                var str = [];
                for (var p in obj) {
                    var val = obj[p];
                    if (angular.isArray(val)) {
                        val.forEach(function(val) {
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(val));
                        });
                    } else {
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(val));
                    }
                }
                return str.join("&");
            };

            /**
             * Authenticate a user (login)

             * @method
             * @name ApiServer#postAuthenticate
             * @param {} auth - Auth definition
             * 
             */
            ApiServer.prototype.postAuthenticate = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/authenticate';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['auth'] !== undefined) {
                    body = parameters['auth'];
                }

                if (parameters['auth'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: auth'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Logout a user

             * @method
             * @name ApiServer#deleteAuthenticate
             * 
             */
            ApiServer.prototype.deleteAuthenticate = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/authenticate';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('DELETE', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Refresh the JWT token

             * @method
             * @name ApiServer#getRefreshToken
             * 
             */
            ApiServer.prototype.getRefreshToken = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/refresh_token';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Validate the JWT token

             * @method
             * @name ApiServer#getCheckToken
             * 
             */
            ApiServer.prototype.getCheckToken = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/check_token';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves a site-wide list of available service definitions.

             * @method
             * @name ApiServer#getServices
             * @param {string} catalog - Filter list for catalog (user, system, all)
             * 
             */
            ApiServer.prototype.getServices = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/services';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['catalog'] !== undefined) {
                    queryParameters['catalog'] = parameters['catalog'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Adds a new service to the service library

             * @method
             * @name ApiServer#postServices
             * @param {} service - Service definition
             * 
             */
            ApiServer.prototype.postServices = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/services';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['service'] !== undefined) {
                    body = parameters['service'];
                }

                if (parameters['service'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: service'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves the service definition.

             * @method
             * @name ApiServer#getServicesByServiceId
             * @param {string} serviceId - The unique service identifier
             * 
             */
            ApiServer.prototype.getServicesByServiceId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/services/{service-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{service-id}', parameters['serviceId']);

                if (parameters['serviceId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: serviceId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Updates a service definition in the service library

             * @method
             * @name ApiServer#putServicesByServiceId
             * @param {} service - Service definition
             * @param {string} serviceId - The unique service identifier
             * 
             */
            ApiServer.prototype.putServicesByServiceId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/services/{service-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['service'] !== undefined) {
                    body = parameters['service'];
                }

                if (parameters['service'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: service'));
                    return deferred.promise;
                }

                path = path.replace('{service-id}', parameters['serviceId']);

                if (parameters['serviceId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: serviceId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('PUT', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Delete a service

             * @method
             * @name ApiServer#deleteServicesByServiceId
             * @param {string} serviceId - The unique service identifier
             * 
             */
            ApiServer.prototype.deleteServicesByServiceId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/services/{service-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{service-id}', parameters['serviceId']);

                if (parameters['serviceId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: serviceId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('DELETE', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves a site-wide list of NDSLabs accounts.

             * @method
             * @name ApiServer#getAccounts
             * 
             */
            ApiServer.prototype.getAccounts = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/accounts';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Adds a new accounts

             * @method
             * @name ApiServer#postAccounts
             * @param {} accounts - Account definition
             * 
             */
            ApiServer.prototype.postAccounts = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/accounts';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['accounts'] !== undefined) {
                    body = parameters['accounts'];
                }

                if (parameters['accounts'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: accounts'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves basic information about a account.

             * @method
             * @name ApiServer#getAccountsByAccountId
             * @param {string} accountId - The unique account identifier
             * 
             */
            ApiServer.prototype.getAccountsByAccountId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/accounts/{account-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{account-id}', parameters['accountId']);

                if (parameters['accountId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: accountId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Updates account information

             * @method
             * @name ApiServer#putAccountsByAccountId
             * @param {} account - Account definition
             * @param {string} accountId - The unique account identifier
             * 
             */
            ApiServer.prototype.putAccountsByAccountId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/accounts/{account-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['account'] !== undefined) {
                    body = parameters['account'];
                }

                if (parameters['account'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: account'));
                    return deferred.promise;
                }

                path = path.replace('{account-id}', parameters['accountId']);

                if (parameters['accountId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: accountId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('PUT', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Delete a account

             * @method
             * @name ApiServer#deleteAccountsByAccountId
             * @param {string} accountId - The unique account identifier
             * 
             */
            ApiServer.prototype.deleteAccountsByAccountId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/accounts/{account-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{account-id}', parameters['accountId']);

                if (parameters['accountId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: accountId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('DELETE', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves a list of stacks for this account.

             * @method
             * @name ApiServer#getStacks
             * 
             */
            ApiServer.prototype.getStacks = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stacks';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Adds a new stack to this account

             * @method
             * @name ApiServer#postStacks
             * @param {} stack - Stack definition
             * 
             */
            ApiServer.prototype.postStacks = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stacks';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['stack'] !== undefined) {
                    body = parameters['stack'];
                }

                if (parameters['stack'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stack'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves the stack definition.

             * @method
             * @name ApiServer#getStacksByStackId
             * @param {string} stackId - The unique stack identifier
             * 
             */
            ApiServer.prototype.getStacksByStackId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stacks/{stack-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{stack-id}', parameters['stackId']);

                if (parameters['stackId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Updates stack information

             * @method
             * @name ApiServer#putStacksByStackId
             * @param {} stack - Stack definition
             * @param {string} stackId - The unique stack identifier
             * 
             */
            ApiServer.prototype.putStacksByStackId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stacks/{stack-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['stack'] !== undefined) {
                    body = parameters['stack'];
                }

                if (parameters['stack'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stack'));
                    return deferred.promise;
                }

                path = path.replace('{stack-id}', parameters['stackId']);

                if (parameters['stackId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('PUT', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Delete a stack

             * @method
             * @name ApiServer#deleteStacksByStackId
             * @param {string} stackId - The unique stack identifier
             * 
             */
            ApiServer.prototype.deleteStacksByStackId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stacks/{stack-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{stack-id}', parameters['stackId']);

                if (parameters['stackId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('DELETE', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Rename the stack

             * @method
             * @name ApiServer#putStacksByStackIdRename
             * @param {} name - Stack name
             * @param {string} stackId - The unique stack identifier
             * 
             */
            ApiServer.prototype.putStacksByStackIdRename = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stacks/{stack-id}/rename';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['name'] !== undefined) {
                    body = parameters['name'];
                }

                if (parameters['name'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: name'));
                    return deferred.promise;
                }

                path = path.replace('{stack-id}', parameters['stackId']);

                if (parameters['stackId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('PUT', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves the stack service log.

             * @method
             * @name ApiServer#getLogsByStackServiceId
             * @param {string} stackServiceId - The unique stack service identifier
             * 
             */
            ApiServer.prototype.getLogsByStackServiceId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/logs/{stack-service-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{stack-service-id}', parameters['stackServiceId']);

                if (parameters['stackServiceId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackServiceId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Starts the specified stack

             * @method
             * @name ApiServer#getStartByStackId
             * @param {string} stackId - The unique stack identifier
             * 
             */
            ApiServer.prototype.getStartByStackId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/start/{stack-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{stack-id}', parameters['stackId']);

                if (parameters['stackId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Stops the specified stack

             * @method
             * @name ApiServer#getStopByStackId
             * @param {string} stackId - The unique stack identifier
             * 
             */
            ApiServer.prototype.getStopByStackId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/stop/{stack-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{stack-id}', parameters['stackId']);

                if (parameters['stackId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: stackId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves a list of service configuration options

             * @method
             * @name ApiServer#getConfigs
             * @param {array} services - services to filter by
             * 
             */
            ApiServer.prototype.getConfigs = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/configs';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['services'] !== undefined) {
                    queryParameters['services'] = parameters['services'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieve the server version

             * @method
             * @name ApiServer#getVersion
             * 
             */
            ApiServer.prototype.getVersion = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/version';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Register

             * @method
             * @name ApiServer#postRegister
             * @param {} account - Account definition
             * 
             */
            ApiServer.prototype.postRegister = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/register';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['account'] !== undefined) {
                    body = parameters['account'];
                }

                if (parameters['account'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: account'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Retrieves a vocabulary

             * @method
             * @name ApiServer#getVocabularyByVocabName
             * @param {string} vocabName - Vocabulary name
             * 
             */
            ApiServer.prototype.getVocabularyByVocabName = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/vocabulary/{vocab-name}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{vocab-name}', parameters['vocabName']);

                if (parameters['vocabName'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: vocabName'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Change the user's password

             * @method
             * @name ApiServer#putChangePassword
             * @param {} password - Change password object
             * 
             */
            ApiServer.prototype.putChangePassword = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/change_password';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['password'] !== undefined) {
                    body = parameters['password'];
                }

                if (parameters['password'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: password'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('PUT', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Verify registered email address

             * @method
             * @name ApiServer#putRegisterVerify
             * @param {} verify - Verification object
             * 
             */
            ApiServer.prototype.putRegisterVerify = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/register/verify';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['verify'] !== undefined) {
                    body = parameters['verify'];
                }

                if (parameters['verify'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: verify'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('PUT', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Request password reset email.

             * @method
             * @name ApiServer#postResetByAccountId
             * @param {string} accountId - The unique account identifier
             * 
             */
            ApiServer.prototype.postResetByAccountId = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/reset/{account-id}';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                path = path.replace('{account-id}', parameters['accountId']);

                if (parameters['accountId'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: accountId'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Submit a support request

             * @method
             * @name ApiServer#postSupport
             * @param {} support - Support request definition
             * 
             */
            ApiServer.prototype.postSupport = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/support';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters['support'] !== undefined) {
                    body = parameters['support'];
                }

                if (parameters['support'] === undefined) {
                    deferred.reject(new Error('Missing required  parameter: support'));
                    return deferred.promise;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };
            /**
             * Get contact information

             * @method
             * @name ApiServer#getContact
             * 
             */
            ApiServer.prototype.getContact = function(parameters) {
                if (parameters === undefined) {
                    parameters = {};
                }
                var deferred = $q.defer();

                var domain = this.domain;
                var path = '/contact';

                var body;
                var queryParameters = {};
                var headers = {};
                var form = {};

                headers['Content-Type'] = ['application/json'];

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters)
                        .forEach(function(parameterName) {
                            var parameter = parameters.$queryParameters[parameterName];
                            queryParameters[parameterName] = parameter;
                        });
                }

                this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

                return deferred.promise;
            };

            return ApiServer;
        })();

        return ApiServer;
    }]);
