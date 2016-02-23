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
.controller('NdsLabsController', [ '$scope', '$cookieStore', '_', 'Services', 'Wizard', 'WizardPage', 'Grid', function($scope, $cookies, _, Services, Wizard, WizardPage, Grid) {
  // Accounting stuff
  $scope.counts = {};
  $scope.svcQuery = '';
  $scope.nextId = 1;
  $scope.configuredStacks = [];
  $scope.stacks = [];

  $scope.toggleStatus = function(svc) {
    svc.status = !svc.status;
  };

  // The delay (in seconds) before allowing the user to click "Next"
  var initDelay = 0;

  var configPages = [
     new WizardPage("intro", "Introduction", {
        prev: null,
        canPrev: false,
        canNext: function() {
          return $scope.newStack && $scope.newStack.name !== '';
        },
        next: 'config',
        onNext: function() {
          console.log("Verifying that the name " + $scope.newStack.name + " has not already been used by another service...");
        }
     }, false),
     new WizardPage("config", "Configuration", {
        prev: 'intro',
        canPrev: true,
        canNext: true,
        next: 'volumes',
        onNext: function() {
          console.log("Adding optional selections to stack...");
          $scope.newStack.services = angular.copy($scope.newStackRequirements);
          angular.forEach($scope.optionalLinksGrid.selector.selection, function(option) {
            var svc = _.find($scope.deps, function(svc) { return svc.key === option.serviceId })
            $scope.newStack.services.push(createStackSvc($scope.newStack, svc));
          }); 
        }
     }, true),
     new WizardPage("volumes", "Volumes", {
        prev: 'config',
        canPrev: true,
        canNext: true,
        next: 'confirm',
        onNext: function() {
          console.log("Verifying that user has made valid 'Volume' selections...");
        }
     }, true),
     new WizardPage("confirm", "Confirmation", {
        prev: 'volumes',
        canPrev: true,
        canNext: true,
        next: 'finish',
        onNext: function() {
          console.log("Sending create stack / volume requests...");
        }
     }, true),
    new WizardPage("finish", "Success!", {
        prev: 'confirm',
        canPrev: true,
        canNext: false,
        next: null
     }, true)
  ];

  // Create a new Wizard to display
  ($scope.resetWizard = function() { 
    $scope.wizard = new Wizard(configPages, initDelay);
  })();

  Services.query(function(data, xhr) {
    console.log("success!");
    console.debug(xhr);
    $scope.deps = data;
    $scope.stacks = _.remove($scope.deps, function(svc) { return svc.stack === true  });
  }, function (headers) {
    console.log("error!");
    console.debug(headers);
  });

  var createStack = function(template) {
    return {
      id: "",
      name: "",
      status: "Suspended",
      services: []
    };
  };

  var createStackSvc = function(stack, svc) {
    return {
      id: "",
      stackId: stack.name,
      serviceId: svc.key,
      status: "Suspended",
      replicas: 1,
      endpoints: []
    };
  };

  $scope.addStack = function(template) {
    $scope.newStackLabel = template.label;
    $scope.newStack = createStack(template);

    $scope.newStackOptions = [];
    var pageSize = 100;
    $scope.optionalLinksGrid = new Grid(pageSize, function() { return $scope.newStackOptions; });

    // Add our base service to the stack
    var base = _.find($scope.stacks, function(svc) { return svc.key === template.key });
    $scope.newStack.services.push(createStackSvc($scope.newStack, base));

    // Add required dependencies to the stack
    $scope.collectDependencies(template);

    $scope.newStackRequirements = angular.copy($scope.newStack.services);

    $scope.resetWizard();

    //  TODO: Get that jQuery outta my controller...
    $('#wizardModal').modal('show');
  };

  $scope.finishWizard = function(newStack) {
    // Associate this stack with our user 
    $scope.configuredStacks.push(newStack);
  };

  // TODO: Use queue for recursion?
  $scope.collectDependencies = function(targetSvc) {
    angular.forEach(targetSvc.dependencies, function(required, key) {
      var svc = _.find($scope.deps, function(svc) { return svc.key === key });
      var stackSvc = createStackSvc($scope.newStack, svc);
      var targetArray = null;
      if (required) {
          targetArray = $scope.newStack.services;
      } else {
          targetArray = $scope.newStackOptions;
      }

      // Check if this service is already present on our proposed stack
      var exists = _.find($scope.newStack.services, function(svc) { svc.key === key });
      if (!exists) {
        // Add the service if it has not already been added
        targetArray.push(stackSvc);
      } else {
        // Skip this service if we see it in the list already
        console.log("Skipping duplicate service: " + svc.key);
      }
    });
  };

  $scope.removeStack = function(stack) {
    $scope.configuredStacks.splice($scope.configuredStacks.indexOf(stack), 1);
  };
}]);
