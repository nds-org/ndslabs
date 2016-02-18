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
.controller('NdsLabsController', [ '$scope', 'appConfig', 'Services', 'Wizard', 'WizardPage', 'Grid', function($scope, appConfig, Services, Wizard, WizardPage, Grid) {
  $scope.appConfig = appConfig;
  appConfig.title = "NDS Labs Prototype";
  appConfig.path = "test/";

  // The delay (in seconds) before allowing the user to click "Next"
  var initDelay = 0;

  var configPages = [
     new WizardPage("intro", "Introduction", {
        prev: null,
        canPrev: false,
        canNext: true,
        next: 'config'
     }, false),

     new WizardPage("config", "Configuration", {
        prev: 'intro',
        canPrev: true,
        canNext: true,
        next: 'confirm'
     }, true),
     new WizardPage("confirm", "Confirmation", {
        prev: 'config',
        canPrev: true,
        canNext: false,
        next: 'finish'
     }, true),
    new WizardPage("finish", "Finish", {
        prev: 'confirm',
        canPrev: true,
        canNext: false,
        next: null
     }, true)
  ];

  // Create a new Wizard to display
  ($scope.resetWizard = function() { 
    $scope.requiredLinksGrid = new Grid([5,10,15,20], function() { return $scope.newService.links.required });
    $scope.optionalLinksGrid = new Grid([5,10,15,20], function() { return $scope.newService.links.optional });
    $scope.wizard = new Wizard(configPages, initDelay);
  })();

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
 
  $scope.nextId = 1;
  $scope.addedServices = [];


  $scope.addService = function(service) {
    $scope.newService = angular.copy(service);
    if ($scope.newService.links || $scope.newService.persisted === 'true') {
      $scope.resetWizard();
      $('#wizardModal').modal('show');
    } else {
      $scope.finishAddingService(service);
    }
  };

  $scope.finishAddingService = function(template, newService) {
    template.count = (template.count || 0) + 1;
    $scope.nextId++;
    newService.id = $scope.nextId;
    $scope.addedServices.push(newService);
    $scope.resetWizard();
    $scope.newService = null;
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
