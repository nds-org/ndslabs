angular
.module('navbar', [])
.factory('appConfig', function() {
  var appConfig = {
    title: ''
  };
  return appConfig;
})
.filter('navbar', function() {
  return function(input, pull) {
    var filtered = [];
    
    var matches;
    switch (pull) {
      case 'left':
        matches = function(nav) { return !nav.right };
        break;
      case 'right':
        matches = function(nav) { return !nav.right };
        break;
    }

    if (!matches) {
      return input;
    }
    
    angular.forEach(input, function(nav) {
      if (pull === 'right' && nav.right === true) {
        filtered.push(nav);
      } else if (pull === 'left' && !nav.right) {
        filtered.push(nav);
      }
    });
    return filtered;
  };
})
.controller('NavbarController', [ '$scope', '$location', 'appConfig', 'LoginRoute', 'ExpressRoute', 'ExpertRoute', 'ManageRoute', 
    function($scope, $location, appConfig, LoginRoute, ExpressRoute, ExpertRoute, ManageRoute) {
  $scope.appConfig = appConfig;
  
  $scope.$watch('appConfig.title', function(newValue, oldValue) {
    $scope.title = newValue;
  });
  
  $scope.$watch('appConfig.path', function(newValue, oldValue) {
    $scope.path = $scope.home.url + newValue;
 });

  // TODO: This is probably horrible, performance-wise
  $scope.isArray = angular.isArray;
  
  $scope.home = 
  {
    name:'NDS Labs',
    url: '#' + LoginRoute
  };

  $scope.navs = [
    {
      name: 'Express Setup',
      url: '#' + ExpressRoute
    },
    {
      name: 'Expert Setup',
      url: '#' + ExpertRoute
    },
    {
      name: 'Manage Deployments',
      url: '#' + ManageRoute,
      right: true
    },
  ];
}]);
