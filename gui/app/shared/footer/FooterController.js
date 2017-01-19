/* global angular:false */

angular
.module('footer', [])
/**
 * The Controller for the Footer
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('FooterController', [ '$scope', '$log', 'NdsLabsApi', 'BuildDate', 'BuildVersion', 'ProductName', 'SupportEmail',
    function($scope, $log, NdsLabsApi, BuildDate, BuildVersion, ProductName, SupportEmail) {
  "use strict";

  $scope.productName = ProductName;
  $scope.supportEmail = SupportEmail;
      
  $scope.guiVersion = BuildVersion;
  $scope.guiBuildDate = BuildDate;
  $scope.showAlertBanner = false;
  
  NdsLabsApi.getVersion().then(function(data, xhr) {
    $scope.apiVersion = data;
    $scope.showAlertBanner = false;
  }, function(headers) {
    $log.error('Failed to grab API Version. Is the server running?');
    $scope.showAlertBanner = true;
  });
}]);
