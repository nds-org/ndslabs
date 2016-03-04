angular
.module('footer', [])
.controller('FooterController', [ '$scope', 'DEBUG', 'Volumes', function($scope, DEBUG, Volumes) {
  $scope.DEBUG = DEBUG;
  $scope.showVolumes = false;
  
  $scope.volumes = Volumes;
  
  $scope.toggleVolumes = function() { $scope.showVolumes = !$scope.showVolumes; };
}]);
