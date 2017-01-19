/* global angular:false */

angular
.module('ndslabs-api')
/**
 * The controller for our "Swagger API" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SwaggerController', [ '$scope', '$log', '$http', '_', 'NdsLabsApi', 'ProductName', 
    function($scope, $log, $http, _, NdsLabsApi, ProductName) {
  "use strict";    
      
  var url = '/app/api/ndslabs.json';
  
  $scope.productName = ProductName;
  $scope.swaggerSpec = '';
  
  $http.get(url).then(function(data) {
    $log.debug("Successfully pulled swagger spec");
    $scope.swaggerSpec = data.data;
  }, function(response) {
    $log.error("Failed to retrieve swagger spec");
  });
}]);
