angular
.module('ndslabs')
.constant('EtcdHost', 'localhost')
.constant('EtcdPort', '4001')
// 'http://' + EtcdHost + ':' + EtcdPort + '/v2/keys/:category/:name'
.factory('Services', [ '$resource', 'EtcdHost', 'EtcdPort', function($resource, EtcdHost, EtcdPort) {
  return $resource('/app/services.json', {category: 'services', name:'@name'}, {
      get: {method:'GET', params:{}},
      put: {method:'PUT', params:{ 'value':'@value' }},
      query: {method:'GET', isArray: true}
    })
}])
.controller('NdsLabsController', [ '$scope', 'appConfig', 'Services', function($scope, appConfig, Services) {
  $scope.appConfig = appConfig;
  appConfig.title = "NDS Labs Prototype";
  appConfig.path = "test/";
  
  $scope.serviceJson = Services.query(function(a, b, c) {
    console.log("success!");
    $scope.services = a;
    console.log(a);
    console.log(b);
    console.log(c);
  }, function (a, b, c) {
    console.log("error!")
    debugger;
  });

  $scope.serviceSearchQuery = '';
 
  $scope.wizard = new Wizard();
 
  $scope.nextId = 1;
  $scope.addedServices = [];
  $scope.addService = function(service) {
    service.count = (service.count || 0) + 1;
    $scope.newService = angular.copy(service);
    $scope.newService.id = $scope.nextId;
    $scope.nextId++;
    $scope.addedServices.push($scope.newService);
  };
  
  $scope.decrementCount = function(serviceKey) {
    angular.forEach($scope.services, function(service) {
      if (serviceKey === service.key) {
        service.count--;
      }
    });
  };
  
  $scope.urls = {
    'apache':'http://tecdistro.com/wp-content/uploads/2015/03/apache318x2601.png?49beef',
    'mongodb':'http://tecadmin.net/wp-content/uploads/2013/07/mongodb-logo-265x250.png',
  };
}]);
