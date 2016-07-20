/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for the "Console Viewer" Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
 
.controller('ConsoleController', [ '$scope', '$routeParams', '$window', function($scope, $routeParams, $window) {
  $window.document.title = 'Console: ' + ($scope.svcId = $routeParams.ssid);
}])