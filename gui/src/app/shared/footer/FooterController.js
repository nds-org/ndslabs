/* global angular:false */

angular
.module('footer', [])
/**
 * The Controller for the Footer
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('FooterController', [ '$scope', '$log', 'DEBUG', 'NdsLabsApi', 'BuildDate', 'BuildVersion', 
    function($scope, $log, DEBUG, NdsLabsApi, BuildDate, BuildVersion) {
  $scope.DEBUG = DEBUG;
  $scope.guiVersion = BuildVersion;
  $scope.guiBuildDate = BuildDate;
  
  NdsLabsApi.getVersion().then(function(data, xhr) {
    $scope.apiVersion = data;
  }, function(headers) {
    $log.error('Failed to grab API Version. Is the server running?');
  });
}]);
