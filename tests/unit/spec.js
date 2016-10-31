describe('SignUpController', function() {
  beforeEach(module('ndslabs'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));
	
  describe('product name', function() {
	it('has the correct value', function() {
      var $scope = {};
      var controller = $controller('SignUpController', { $scope: $scope });
      expect($scope.productName).toEqual('Labs Workbench');
	});
  });
  
  describe('eula link', function() {
	it('has the correct value', function (){
      var $scope = {};
      var controller = $controller('SignUpController', { $scope: $scope });
      expect($scope.eulaLink.url).toEqual('https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy');
	});
  });

  describe('signUp form', function() {
    it('is invalid if passwords do not match', function() {
      var $scope = {};
      var controller = $controller('SignUpController', { $scope: $scope });
      $scope.newProject.password = 'longerthaneightchars';
	  
	 
	  // TODO: How to write expecations?
      //expect($scope.forms['registerForm).toEqual(false);
    });
  });
});
