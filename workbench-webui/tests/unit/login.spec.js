/* global angular:false expect:false inject:false module:false */

describe('LoginController', function() {
  "use strict";

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
    
    $scope = $rootScope.$new();
    controller = $controller('LoginController', { $scope: $scope });
	
      
    $httpBackend.whenPOST(ApiUri.api + '/authenticate', { username: TEST_USERNAME, password: TEST_PASSWORD}).respond("a successful response");
    $httpBackend.whenPOST(ApiUri.api + '/authenticate', { username: TEST_USERNAME, password: TEST_INVALID_PASSWORD}).respond(401, "a successful response");
  }));
 
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
  
  describe('$scope.productName', function() {
  	it('has the correct value', function() {
      expect($scope.productName).toEqual('Labs Workbench');
  	});
  });
  
  describe('$scope.login()', function() {
  	it('accepts valid login', function() {
	  var authInfo = AuthInfo.get();
	  
    expect(authInfo.namespace).toEqual('');
    expect(authInfo.password).toEqual('');
	  
	  authInfo.namespace = TEST_USERNAME;
	  authInfo.password = TEST_PASSWORD;
	  
	  $httpBackend.expectPOST(ApiUri.api + '/authenticate', { username: TEST_USERNAME, password: TEST_PASSWORD });
	  $scope.login();
	  $httpBackend.flush();
      
	  // Progress resets on completion, and no error message shows
      expect($scope.progressMessage).toEqual('');
      expect($scope.errorMessage).toEqual('');
  	});
  	
  	it('denies invalid login', function() {
	  var authInfo = AuthInfo.get();
	  
      expect(authInfo.namespace).toEqual('');
      expect(authInfo.password).toEqual('');
	  
	  
	  authInfo.namespace = TEST_USERNAME;
	  authInfo.password = TEST_INVALID_PASSWORD;
	  
      expect($scope.progressMessage).not.toBeDefined();
      expect($scope.errorMessage).not.toBeDefined();
	  
	  $httpBackend.expectPOST(ApiUri.api + '/authenticate', { username: TEST_USERNAME, password: TEST_INVALID_PASSWORD });
	  $scope.login();
	  
      expect($scope.progressMessage).toEqual('Please wait...');
      expect($scope.errorMessage).toEqual('');
	  
	  $httpBackend.flush();
	  
	  // Progress resets on completion, error message shows for error
      expect($scope.progressMessage).toEqual('');
      expect($scope.errorMessage).toEqual('Invalid username or password');
	  
  	});
  });
  
  describe('$scope.logout()', function() {
  	it('purges auth user state', function() {
  	  $scope.logout();
  	  
  	  // Nothing async here, so no progress/error messages expected
      expect($scope.errorMessage).toEqual('');
      expect($scope.progressMessage).toEqual('');
      
	  var authInfo = AuthInfo.get();
	  
      expect(authInfo.namespace).toEqual('');
      expect(authInfo.password).toEqual('');
      
      //expect()
      // TODO: How to verify route changes?
  	});
  });
});
