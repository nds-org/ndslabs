angular
.module('test')
.controller('FooterController', [ '$scope', function($scope) {
  $scope.trademark = '';
  $scope.today = new Date();
}]);