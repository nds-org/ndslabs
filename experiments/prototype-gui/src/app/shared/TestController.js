angular
.module('test')
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
.filter('fromTo', function() {
  return function(input, from, total, lessThan) {
    from = parseInt(from);
    total = parseInt(total);
    for (var i = from; i < from+total && i<lessThan; i++) {
      input.push(i);
    }
    return input;
  }
})
.directive('myDraggable', ['$document', function($document) {
  return function(scope, element, attr) {
    var startX = 0, startY = 0, x = 0, y = 0;

    element.css({
     position: 'absolute',
     border: '1px solid red',
     backgroundColor: 'lightgrey',
     cursor: 'pointer'
    });

    element.on('mousedown', function(event) {
      // Prevent default dragging of selected content
      event.preventDefault();
      startX = event.pageX - x;
      startY = event.pageY - y;
      $document.on('mousemove', mousemove);
      $document.on('mouseup', mouseup);
    });

    function mousemove(event) {
      y = event.pageY - startY;
      x = event.pageX - startX;
      element.css({
        transform: 'translate('+x+'px,'+y+'px)',
    WebkitTransform: 'translate('+x+'px,'+y+'px)'
      });
  console.log(element.css('transform'));
    }

    function mouseup() {
      $document.off('mousemove', mousemove);
      $document.off('mouseup', mouseup);
    }
  };
}])
.controller('TestController', [ '$scope', 'appConfig', 'Services', function($scope, appConfig, Services) {
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

  $scope.disabled = false;
  
  $scope.serviceSearchQuery = '';
  /*$scope.services = [
    { key: 'apache', label: 'Apache' },
    { key: 'gitlab', label: 'GitLab' },
    { key: 'mongodb', label: 'MongoDB' },
    { key: 'mediawiki', label: 'MediaWiki' },
    { key: 'mysql', label: 'MySQL' },
    { key: 'postgresql', label: 'postgresql' },
    { key: 'rabbitmq', label: 'RabbitMQ' },
  ];*/
  
  $scope.nextId = 1;
  $scope.addedServices = [];
  $scope.addService = function(service) {
    service.count = (service.count || 0) + 1;
    $scope.newService = angular.copy(service);
    $scope.newService.id = $scope.nextId;
    $scope.nextId++;
    $scope.disabled = true;
    $scope.addedServices.push($scope.newService);
  };
  
  $scope.removeService = function(service) {
    // Update state
    $scope.decrementCount(service.key);
    if (service === $scope.newService) {
      $scope.disabled = false;
    }
    
    // Gather up any connections that have this service as a start/endpoint
    var toRemove = [];
    angular.forEach($scope.addedServices, function(svc) {
      $scope.removeConnection(service, svc);
    });
    
    // Finally, remove the service itself
    $scope.removeElement(service.id);
    $scope.addedServices.splice($scope.addedServices.indexOf(service), 1);
  };
  
  $scope.start = $scope.end = null;
  $scope.selectService = function(element) {
    angular.forEach($scope.addedServices, function(service) {
      if (element.id === service.id) {
        service.element = element;
        if ($scope.end === null && $scope.start === null) {
          // Select this point as the start point of a line
          service.element.c = 'green';
          $scope.start = service;
          console.log("Selected start: " + service.id);
        } else if ($scope.end === null) {
          // Selected the same service twice: de-select it
          if ($scope.start === service) {
            $scope.start.element.c = 'black';
            $scope.start = null;
            return;
          }
        
          // Select this point as the end point of a line
          $scope.end = service;
          $scope.addConnection($scope.start, $scope.end);
          $scope.start.element.c = $scope.end.element.c = 'black';
          $scope.start = $scope.end = null;
          console.log("Selected end: " + service.id);
        }
      }
    });
  };
  
  $scope.addConnection = function(start, end) {
    start.connections = start.connections || [];
    end.connections = end.connections || [];
    
    // Check to see if this connection already exists, and remove it if it does
    if (start.connections.indexOf(end.id) !== -1 || end.connections.indexOf(start.id) !== -1) {
      $scope.removeConnection(start, end);
      return;
    }

    start.connections.push(end.id);
    end.connections.push(start.id);
    
    // Line mode  
    $scope.elements.push({
      "type":1,
      "x":end.element.x,
      "y":end.element.y,
      "lx":start.element.x,
      "ly":start.element.y,
      "r":$scope.radius,
      "f":0,
      "sw":$scope.sw,
      "st":$scope.start,
      "nd":$scope.end,
      "id":$scope.start + "_" + $scope.end
    });
    console.debug($scope.elements);
  };
  
  $scope.removeConnection = function(start, end) {
    if (!start.connections || start.connections.indexOf(end.id) === -1) {
      return;
    }
    
    if (!end.connections || end.connections.indexOf(start.id) === -1) {
      return;
    }
  
    start.connections.splice(start.connections.indexOf(end.id), 1);
    end.connections.splice(end.connections.indexOf(start.id), 1);
    
    angular.forEach($scope.elements, function(element) {
      if ((element.st === start && element.nd === end)
          || (element.st === end && element.nd === start)) {
        $scope.elements.splice($scope.elements.indexOf(element), 1);
      }
    });
  };
  
  $scope.decrementCount = function(serviceKey) {
    angular.forEach($scope.services, function(service) {
      if (serviceKey === service.key) {
        service.count--;
      }
    });
  };
  
  $scope.currentToolName = 'Circle';
  $scope.selectTool = function(tool) {
    var toolName = $scope.currentToolName = tool;
    if (toolName === 'Circle') {
      $scope.currentTool = 0;
    } else if (toolName === 'Line') {
      $scope.currentTool = 1;
    }
  };
  
  $scope.urls = {
    'apache':'http://tecdistro.com/wp-content/uploads/2015/03/apache318x2601.png?49beef',
    'mongodb':'http://tecadmin.net/wp-content/uploads/2013/07/mongodb-logo-265x250.png',
  };
  
  $scope.tools = ['Circle','Line'];
  $scope.currentTool = 0;
  $scope.x = 0;
  $scope.y = 0;
  $scope.lastX = 0;
  $scope.lastY = 0;
  $scope.sw = 5;
  
  $scope.draw = function(e) {
    if (!$scope.disabled) {
      return;
    }
    // Circle mode
    $scope.lastX = $scope.x;
    $scope.lastY = $scope.y;
    $scope.x = e.offsetX;
    $scope.y = e.offsetY;
    $scope.elements.push({
      "type":0,
      "x":$scope.x,
      "y":$scope.y,
      "lx":$scope.lastX,
      "ly":$scope.lastY,
      "r":7 * $scope.newService.label.length,
      "f":0,
      "sw":$scope.sw,
      "id":$scope.newService.id,
      "lbl":$scope.newService.label
    });
  };
  
  $scope.removeElement = function(id) {
    // Remove this element from the canvas
    var target = null;
    angular.forEach($scope.elements, function(element) {
      if (element.id === id) {
        target = element;
        return;
      }
    });
    $scope.elements.splice($scope.elements.indexOf(target), 1);
  };
  
  $scope.graph = {'width': '100%', 'height': 500};
  $scope.elements = [];
}]);
