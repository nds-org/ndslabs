/* global angular:false */

angular
.module('ndslabs')
/**
 * The controller for our "Landing Page" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LandingController', [ '$scope', '$location', '$log', '_', 'AuthInfo', 'OrgName', 'ProductName', 'ProductUrl', 'HelpLinks',  
    function($scope, $location, $log, _, authInfo, OrgName, ProductName, ProductUrl, HelpLinks) {
  $scope.orgName = OrgName;
  $scope.productName = ProductName;
  $scope.helpLinks = HelpLinks;
  
  $scope.featureLink = _.find($scope.helpLinks, [ 'name', 'Feature Overview' ]);
}]);
