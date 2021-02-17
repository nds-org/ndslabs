/* global angular:false */

angular
.module('ndslabs-landing')
/**
 * The Controller for the "Contact Us" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
 
.controller('HelpController', [ '$scope', '$rootScope', '$routeParams', '$timeout', 'NdsLabsApi', 'ProductName', 'SupportEmail', 'ReturnRoute', 'AuthInfo',
    function($scope, $rootScope, $routeParams, $timeout, NdsLabsApi, ProductName, SupportEmail, ReturnRoute, AuthInfo) {
  "use strict";
  
  $rootScope.rd = '';
  if ($routeParams.rd) {
    ReturnRoute = $routeParams.rd;
    $rootScope.rd = encodeURIComponent(ReturnRoute);
  }
  
  $scope.auth = AuthInfo.get();

  $scope.types = [
    { label: "Request Help", value: "help", placeholder: "Describe a specific scenario that is causing problems or preventing you from working in " + ProductName + "..." },
    { label: "Make a Wish", value: "wish", placeholder: "Describe a change or new feature you would like to see in " + ProductName + "..." },
    { label: "Report a Bug", value: "bug", placeholder: "Describe unexpected or confusing behavior of " + ProductName + "..." },
    { label: "General Comment", value: "comment", placeholder: "Any notes or comments you would like to forward to the development team of " + ProductName + "..." }
  ];
  
  $scope.productName = ProductName;
    
  NdsLabsApi.getContact().then(function(response) {
    var contact = response.data;
    $scope.support = contact;
      
    $scope.links = [
      //{ id: "ggroup", label: "Help Forum", url: contact.forum, icon: "fa-bullhorn", description: "Discuss with the support team and community" },
      //{ id: "gitter", label: "Live Chat", url: contact.chat, icon: "fa-comments", description: "Chat with the support team and community" },
      { id: "email", label: "Support E-mail", url:  "mailto:" + SupportEmail, icon: "fa-envelope", description: "Ask for support via free-form e-mail" },
    ];
  });
  
  $scope.forms = {};
  $scope.status = 'unsent';
  
  /** Resets the "Submit Feedback" form */
  ($scope.resetForm = function() {
    var request = $scope.request = {
        "anonymous": false, 
        "type": $scope.types[0].value, 
        "message": ""
    };
    return request;
  })(); // jshint ignore:line
  
  /** Disable "anonymous" checkbox for "help" requests */
  $scope.$watch('request.type', function(newValue, oldValue) {
    if (newValue === 'help') {
      $scope.request.anonymous = false;
    }
  });
  
  $scope.submitFeedback = function() {
    if ($scope.status !== 'unsent') {
      return;
    }
    
    $scope.status = "sending";
    return NdsLabsApi.postSupport({ support: $scope.request }).then(function(response) {
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
