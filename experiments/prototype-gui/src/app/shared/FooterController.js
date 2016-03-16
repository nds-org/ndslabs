angular
.module('footer', [])
/**
 * The Controller for the Footer (currently unused/ hidden)
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('FooterController', [ '$scope', 'DEBUG', 'Volumes', function($scope, DEBUG, Volumes) {
  $scope.DEBUG = DEBUG;
  $scope.showVolumes = false;
  
  $scope.volumes = Volumes;
  
  $scope.toggleVolumes = function() { $scope.showVolumes = !$scope.showVolumes; };
}]);
