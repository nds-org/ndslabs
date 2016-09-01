/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for the "Contact Us" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
 
.controller('HelpController', [ '$scope', '$routeParams', '$window', 'NdsLabsApi', function($scope, $routeParams, $window, NdsLabsApi) {
  $scope.types = [
    { label: "Make a Wish", value: "wish", placeholder: "Describe a change or new feature you would like to see in NDS Labs..." },
    { label: "Request Help", value: "help", placeholder: "Describe a scenario that is causing you problems or preventing you from working in NDS Labs..." },
    { label: "Report a Bug", value: "bug", placeholder: "Describe unexpected or confusing behavior of NDS Labs..." },
    { label: "General Comment", value: "wish", placeholder: "Any other notes or comments you would like to forward to the development team of NDS Labs..." }
  ];
  
  $scope.selectedType = $scope.types[0];
    
  NdsLabsApi.getContact().then(function(contact) {
      $scope.support = contact;
  });
  
  $scope.submitFeedback = function(type, message) {
      var request = {
       "type": type, 
       "message": message
    };
    
    return NdsLabsApi.postSupport({ account: request });
  };
}])