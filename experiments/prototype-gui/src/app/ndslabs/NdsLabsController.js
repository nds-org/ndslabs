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
.controller('NdsLabsController', [ '$scope', '$cookieStore', 'Services', 'Wizard', 'WizardPage', 'Grid', function($scope, $cookies, Services, Wizard, WizardPage, Grid) {
  // Accounting stuff
  $scope.counts = $cookies.get("counts") || {};
  $scope.serviceSearchQuery = '';
  $scope.nextId = $cookies.get("nextId") || 1;
  $scope.addedServices = $cookies.get("state") || [];

  $scope.commit = function() {
    $cookies.put("state", $scope.addedServices);
    $cookies.put("counts", $scope.counts);
    $cookies.put("nextId", $scope.nextId);
  };

  $scope.toggleStatus = function(svc) {
    svc.status = !svc.status;
  };

  $scope.deploy = function() {
    angular.forEach($scope.addedServices, function(svc) {
      svc.status = true;
    });
  };

  var getServiceByName = function(list, key) {
    var ret = null;
    angular.forEach(list, function(svc) {
      if (key === svc.key) {
        ret = svc;
      }
    });
    return ret;
  };

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

  $scope.addService = function(service) {
    $scope.newService = angular.copy(service);
    if ($scope.newService.links || $scope.newService.persisted === 'true') {
      $scope.resetWizard();
      $('#wizardModal').modal('show');
    } else {
      $scope.finishAddingService($scope.newService);
    }
  };

  $scope.finishAddingService = function(newService) {
    // Add our main service
    $scope.performAdd(angular.copy(newService));

    // Add its required links
    angular.forEach(newService.links.required, function(req) {
      var service = getServiceByName($scope.serviceJson, req);
      $scope.performAdd(angular.copy(service))
    });

    // Now handle our optional links
    angular.forEach($scope.optionalLinksGrid.selector.selection, function(opt) {
      var fragments = opt.split(":");
      angular.forEach(fragments, function(frag) {
        var service = getServiceByName($scope.serviceJson, frag);
        $scope.performAdd(angular.copy(service))
      });
    });
    //$scope.resetWizard();
    $scope.newService = null;
  };

  $scope.performAdd = function(newService) {
    newService.connections = [];
    if (newService.links) {
      if (newService.links.required) {  
        newService.connections = newService.links.required;
      }
      if (newService.links.optional) {
        newService.connections = newService.connections.concat(newService.links.optional);
      }
    }
    if (getServiceByName($scope.addedServices, newService.key) === null) {
      newService.id = $scope.nextId++;
      $scope.counts[newService.key] = ($scope.counts[newService.key] || 0) + 1;
      $scope.addedServices.push(newService);
    } else {
      console.log(newService.key + ' is already present.. skipping duplicate');
    }
  }
  
  $scope.removeService = function(service) {
    $scope.addedServices.splice($scope.addedServices.indexOf(service), 1);
    $scope.decrementCount(service.key)    
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
