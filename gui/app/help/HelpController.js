/* global angular:false */

angular
.module('ndslabs')
/**
 * The Controller for the "Contact Us" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
 
.controller('HelpController', [ '$scope', '$timeout', 'NdsLabsApi', 'ProductName', 'SupportEmail',
    function($scope, $timeout, NdsLabsApi, ProductName, SupportEmail) {
  "use strict";

  $scope.types = [
    { label: "Request Help", value: "help", placeholder: "Describe a specific scenario that is causing problems or preventing you from working in " + ProductName + "..." },
    { label: "Make a Wish", value: "wish", placeholder: "Describe a change or new feature you would like to see in " + ProductName + "..." },
    { label: "Report a Bug", value: "bug", placeholder: "Describe unexpected or confusing behavior of " + ProductName + "..." },
    { label: "General Comment", value: "comment", placeholder: "Any notes or comments you would like to forward to the development team of " + ProductName + "..." }
  ];
  
  $scope.productName = ProductName;
  
  $scope.forms = {};
  $scope.status = "unsent";
  
  ($scope.resetForm = function() {
    var request = $scope.request = {
        "anonymous": false, 
        "type": $scope.types[0].value, 
        "message": ""
    };
    return request;
  })(); // jshint ignore:line
  
  $scope.$watch('request.type', function(newValue, oldValue) {
    if (newValue === 'help') {
      $scope.request.anonymous = false;
    }
  });
    
  NdsLabsApi.getContact().then(function(contact) {
    $scope.support = contact;
      
    $scope.links = [
      { id: "ggroup", label: "Google Group", url: contact.forum, icon: "fa-bullhorn", description: "Discuss with the support team and community" },
      { id: "gitter", label: "Gitter", url: contact.chat, icon: "fa-comments", description: "Chat with the support team and community" },
      { id: "email", label: "E-mail", url:  "mailto:" + SupportEmail, icon: "fa-envelope", description: "Ask for support via free-form e-mail" },
    ];
  });
  
  $scope.submitFeedback = function() {
    if ($scope.status !== 'unsent') {
      return;
    }
    
    $scope.status = "sending";
    return NdsLabsApi.postSupport({ support: $scope.request }).then(function(data) {
      $scope.resetForm();
      $scope.forms.supportForm.messageField.$pristine = true;
      $scope.status = "sent";
      $timeout(function() {
        $scope.status = 'unsent';
      }, 5000);
    }, function() {
      $scope.status = "error";
    });
  };
}]);