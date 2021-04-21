/* global angular:false expect:false inject:false module:false */

describe('SignUpController', function() {
  "use strict";

  // Inject ndslabs module before each test
  beforeEach(module('ndslabs'));
  beforeEach(module('ndslabs-api'));

  // Injected / mocked angular services
  var $controller, controller, $scope, $rootScope;
  
  // Parameterized test case data
  var TEST_NAME = 'Test User';
  var TEST_USERNAME = 'testuser';
  var TEST_PASSWORD = '123456';
  var TEST_UNMATCHED_PASSWORD = 'Not The Same Password';
  var TEST_EMAIL = 'test@user.com';
  var TEST_ORGANIZATION = 'NDS';
  var TEST_DESCRIPTION = 'Running unit tests against Labs Workbench';

  // Inject the $controller service, initialize controller and $scope before each test
  beforeEach(inject(function(_$controller_, _$rootScope_) {
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    
    $scope = $rootScope.$new();
    controller = $controller('SignUpController', { $scope: $scope });
  }));
  
  describe('$scope.productName', function() {
  	it('has the correct value', function() {
      expect($scope.productName).toEqual('Labs Workbench');
  	});
  });
  
  describe('$scope.eulaLink', function() {
  	it('has the correct values', function (){
  	  expect($scope.eulaLink.name).toEqual('Acceptable Use Policy');
      expect($scope.eulaLink.url).toEqual('https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy');
  	});
  });

  describe('$scope.ok(account)', function() {
    // Mock NdsLabsApi service
    
    // Mock Project service
    var Project, ApiUri, $httpBackend;
    beforeEach(inject(function (_ApiUri_, _Project_, _$httpBackend_) {
      ApiUri = _ApiUri_;
      Project = _Project_;
      $httpBackend = _$httpBackend_;
      
      $httpBackend.when('POST', ApiUri.api + '/register').respond("a successful response");
    }));
  
    // Ensure backend has responded to all requests before finishing
	afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });
  
    it('does not accept invalid account registration', function() {
      var account = Project.create();
      
      // Input mismatched passwords
      account.email = TEST_EMAIL;
      account.name = TEST_NAME;
      account.description = TEST_DESCRIPTION;
      account.organization = TEST_ORGANIZATION;
      
      account.namespace = TEST_USERNAME;
      account.password = TEST_PASSWORD;
      account.passwordConfirmation = TEST_UNMATCHED_PASSWORD;
      
      // Progress message should not display before clicking submit
      expect($scope.progressMessage).toEqual('');
      expect($scope.errorMessage).not.toBeDefined();
      var valid = $scope.ok(account);
      
      // Method should return false
      expect(valid).toEqual(false);
      
      // Progress message should not change when submit is clicked
      expect($scope.errorMessage).not.toBeDefined();
      expect($scope.progressMessage).toEqual('');
      expect($scope.showVerify).toEqual(false);
    });
    
    it('accepts valid account registration', function() {
      var account = Project.create();
      
      // Input valid account information
      account.namespace = TEST_USERNAME;
      account.password = account.passwordConfirmation = TEST_PASSWORD;
      account.email = TEST_EMAIL;
      account.name = TEST_NAME;
      account.description = TEST_DESCRIPTION;
      account.organization = TEST_ORGANIZATION;
    
      // Progress message should not display before clicking submit
      expect($scope.progressMessage).toEqual('');
      expect($scope.errorMessage).not.toBeDefined();
      
      // Expect a POST to the /register endpoint
      $httpBackend.expectPOST(ApiUri.api + '/register', account);
      var valid = $scope.ok(account);
      
      // Method should return a Promise
      expect(valid).not.toEqual(false);
      
      // Progress message should change during request
      expect($scope.progressMessage).toEqual('Please wait...');
      expect($scope.errorMessage).toEqual('');
      $httpBackend.flush();
      
      // Ensure that all of our values came back as expected
      expect($scope.progressMessage).toEqual('');
      expect($scope.errorMessage).toMatch('');
      expect($scope.showVerify).toEqual(true);
    });
  });
});
