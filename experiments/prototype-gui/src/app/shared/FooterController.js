angular
.module('footer', [])
.controller('FooterController', [ '$scope', function($scope) {
  $scope.showVolumes = false;
  
  $scope.volumes = [
    { name: 'volume1', format:'raw', size:'100', sizeUnits:'GB', attachment:'Clowder-01' },
    { name: 'volume2', format:'raw', size:'100', sizeUnits:'GB', attachment:null }
  ];
  
  $scope.toggleVolumes = function() { $scope.showVolumes = !$scope.showVolumes; };
}]);
