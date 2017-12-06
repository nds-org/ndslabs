/* global angular:false */

angular
.module('ndslabs-landing')
/**
 * The controller for our "Swagger API" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SwaggerController', [ '$scope', '$rootScope', '$routeParams', '$log', '$http', '_', 'NdsLabsApi', 'ProductName', 'ReturnRoute',
    function($scope, $rootScope, $routeParams, $log, $http, _, NdsLabsApi, ProductName, ReturnRoute) {
  "use strict";
  
  $rootScope.rd = '';
  if ($routeParams.rd) {
    ReturnRoute = $routeParams.rd;
    $rootScope.rd = encodeURIComponent(ReturnRoute);
  }
      
  var url = '/app/api/swagger.yaml';
  
  $scope.productName = ProductName;
  $scope.swaggerSpec = '';
  
  $http.get(url).then(function(data) {
    $log.debug("Successfully pulled swagger spec");
    $scope.swaggerSpec = data.data;
  }, function(response) {
    $log.error("Failed to retrieve swagger spec");
  });
}]);
