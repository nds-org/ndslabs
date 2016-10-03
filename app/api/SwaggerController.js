/* global angular:false */

angular
.module('ndslabs-api')
/**
 * The controller for our "Sign-Up" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SwaggerController', [ '$scope', '$log', '$http', '_', 'NdsLabsApi', 'ProductName', 
    function($scope, $log, $http, _, NdsLabsApi, ProductName) {
  var url = '/app/api/ndslabs.json';
  
  $scope.productName = ProductName;
  $scope.swaggerSpec = '';
  
  $http.get(url).then(function(data) {
    console.debug(data.data);
    $scope.swaggerSpec = data.data;
  }, function(response) {
    console.debug(response);
  });
}]);
