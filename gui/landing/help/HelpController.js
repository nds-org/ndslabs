/* global angular:false */

angular
.module('ndslabs-landing')
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
    
  NdsLabsApi.getContact().then(function(contact) {
    $scope.support = contact;
      
    $scope.links = [
      { id: "ggroup", label: "Help Forum", url: contact.forum, icon: "fa-bullhorn", description: "Discuss with the support team and community" },
      { id: "gitter", label: "Live Chat", url: contact.chat, icon: "fa-comments", description: "Chat with the support team and community" },
      { id: "email", label: "Support E-mail", url:  "mailto:" + SupportEmail, icon: "fa-envelope", description: "Ask for support via free-form e-mail" },
    ];
  });
}]);