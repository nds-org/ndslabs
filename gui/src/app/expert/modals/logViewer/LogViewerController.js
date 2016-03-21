/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Log Viewer" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LogViewerCtrl', [ '$scope', '$log', '$uibModalInstance', '$interval', '$location', '$anchorScroll', '_', 'NdsLabsApi', 'projectId', 'service',
    function($scope, $log, $uibModalInstance, $interval, $location, $anchorScroll, _,  NdsLabsApi, projectId, service) {
  $scope.service = service;
  $scope.serviceLog = '';
  
  $scope.gotoAnchor = function(x) {
      var newHash = x;
      if ($location.hash() !== newHash) {
        // set the $location.hash to `newHash` and
        // $anchorScroll will automatically scroll to it
        $location.hash(x);
      } else {
        // call $anchorScroll() explicitly,
        // since $location.hash hasn't changed
        $anchorScroll();
      }
    };
  
  ($scope.refreshLog = function() {
    NdsLabsApi.getProjectsByProjectIdLogsByStackServiceId({
      'projectId': projectId,
      'stackServiceId': service.id
    }).then(function(data, xhr) {
      $log.debug('successfully grabbed logs for serviceId ' + service.id);
      $scope.serviceLog = data;
      $scope.gotoAnchor('bottom');
    }, function(headers) {
      $log.error('error grabbing logs for service ' + service.id);
    });
  })();
  
  var interval = $interval($scope.refreshLog, 2000);

  $scope.ok = function() {
    $log.debug("Closing modal with success!");
    $uibModalInstance.close($scope.serviceLog);
    $interval.cancel(interval);
    interval = null;
  };
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
    $interval.cancel(interval);
    interval = null;
  };
}]);