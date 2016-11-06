/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var help = require('./pages/help.page.js');
var dashboard = require('./pages/dashboard.page.js');
var landing = require('./pages/landing.page.js');

var generateTestMessage = function(type) { 
  return 'This is a test of the "' + type + '" feedback submission system.'
      + ' No help is being requested. Please go about your normal business. I repeat, this is only a test.'; 
};

// help.e2e.js
describe('Labs Workbench Contact Us View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    help.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should link to the support forum', function() {
    help.clickForum();
    helpers.expectNewTabOpen(shared.config.FORUM_LINK);
  });
  
  it('should link to the support chat', function() {
    help.clickChat();
    helpers.expectNewTabOpen(shared.config.CHAT_LINK);
  });
  
  it('should link to the support e-mail', function() {
    //help.clickEmail();
    // FIXME: How to verify "mailto:" links without breaking the PageObject pattern?
    expect(element(by.id('emailBtn')).getAttribute('href')).toEqual(shared.config.EMAIL_LINK);
  });
  
  
  describe('After Sign In', function() {
    beforeAll(function() {
      dashboard.get();
    });
    
    afterAll(function() {
      shared.navbar.expandAccountDropdown();
      shared.navbar.clickSignOut();
      landing.verify();
    });
    
    // FIXME: How to do verify error-handling with PageObjects
    var submitBtn = function() {  return element(by.css('[ng-click="submitFeedback()"]')); };
    
    var expectBtn = function(enabled) {
      expect(submitBtn().isDisplayed()).toBe(true);
      expect(submitBtn().isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
    };
    
    it('should prevent the user from sending an empty message', function() {
      expectBtn(false);
      
      // FIXME: How to do verify error-handling without breaking the PageObjects pattern
      //help.clickSubmitFeedback();
    });
  
    it('should allow the user to send a help request', function() {
      // This should be a noop, as 'Request Help' is selected by default
      help.selectFeedbackType(0); 
      help.enterFeedbackMessage(generateTestMessage('Request Help'));
      
      expectBtn(true);
      
      // FIXME: How to verify support e-mails without breaking the PageObjects pattern?
      //help.clickSubmitFeedback();
    });
  });
});