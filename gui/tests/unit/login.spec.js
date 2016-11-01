/* global angular:false expect:false inject:false module:false */

describe('LoginController', function() {
  // Inject ndslabs module before each test
  beforeEach(module('ndslabs'));
  beforeEach(module('ndslabs-api'));

  // Injected / mocked angular services
  var $controller, controller, $scope, $rootScope;
  
  // Parameterized test case data
  var TEST_USERNAME = 'testuser';
  var TEST_PASSWORD = '123456';
  var TEST_INVALID_PASSWORD = 'Not The Same Password';
  
  
  var AuthInfo, ApiUri, $httpBackend;

  // Inject the $controller service, initialize controller and $scope before each test
  beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _ApiUri_, _AuthInfo_) {
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    
    AuthInfo = _AuthInfo_;
    ApiUri = _ApiUri_;
    
    $scope = $rootScope.new();
    controller = $controller('LoginController', { $scope: $scope });
  }));
  
  describe('$scope.productName', function() {
  	it('has the correct value', function() {
      expect($scope.productName).toEqual('Labs Workbench');
  	});
  });
  
  describe('$scope.login()', function() {
  	it('accepts valid login', function() {
  	  
  	});
  	
  	it('denies invalid login', function() {
  	  
  	});
  });
  
  
  
  describe('$scope.logout()', function() {
  	it('purges auth user state', function($location) {
  	  $scope.logout();
  	  
  	  // Nothing async here, so no progress/error messages expected
      expect($scope.errorMessage).toEqual('');
      expect($scope.progressMessage).toEqual('');
      
      console.debug(AuthInfo);
      console.debug(AuthInfo.get());
      
      //expect()
      // TODO: How to verify route changes?
  	});
  });
});
