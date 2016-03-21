/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for our "Log Viewer" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ConfigViewerCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'ApiHost', 'NdsLabsApi', 'service',
    function($scope, $log, $uibModalInstance, _, ApiHost, NdsLabsApi, service) {
  $scope.service = service;
  $scope.apiHost = ApiHost;
  
  // Build up our display of current property values
  $scope.configs = [];
  angular.forEach(service.config, function(value, name) {
    $scope.configs.push({ name: name, value: value, defaultValue: ''});
  });
  
  // Now populate the default values of each property
  NdsLabsApi.getConfigs({ 'services': [ service.service ] }).then(function(data, headers) {
    angular.forEach(data[service.service], function(cfg) {
      var config = _.find($scope.configs, [ 'name', cfg.name ]);
      config.defaultValue = cfg.value;
    });
  }, function() {
    $log.error('Failed to grab custom config for ' + service.service);
  });
  
  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);