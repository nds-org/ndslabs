angular
.module('ndslabs')
.filter('containsUnconfiguredStack', function() {
  return function(stacks) {
    var result = false;
    angular.forEach(stacks, function(stack) {
      if (!stack.name || stack.name === '') {
        result = true;
      }
    });
    return result;
  };
})
.controller('ExpressSetupController', [ '$scope', '$log', '_', function($scope, $log, _) {
  $scope.stacks = [];
  
  $scope.selectStack = function(stack) { $scope.selectedStack = stack; };
  ($scope.deselectStack = function() { $scope.selectedStack = null })();
  
  // Confirm adding a new stack
  $scope.saveStackName = function(stack, newStackName) { stack.name = newStackName; };
}]);