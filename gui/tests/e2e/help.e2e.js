/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var ContactUsPage = require('./pages/help.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LandingPage = require('./pages/landing.page.js');

var TIMEOUT_EXPECT_NEW_TAB = 30000;

var OPTION_REQUEST_HELP = 0;
var OPTION_MAKE_A_WISH = 1;
var OPTION_REPORT_A_BUG = 2;
var OPTION_GENERAL_COMMENT = 3;

var generateTestMessage = function(type) { 
  return 'This is a test of the "' + (type || 'Request Help') + '" feedback submission system.' +
         ' No help is being requested. Please go about your normal business. I repeat, this is only a test.'; 
};

// help.e2e.js
describe('Labs Workbench Contact Us View', function() {
  "use strict";

  var navbar = new Navbar();
  var contactUsPage = new ContactUsPage();
  var dashboardPage = new DashboardPage();
  var landingPage = new LandingPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    contactUsPage.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should link to the support forum', function(done) {
    contactUsPage.forumBtn.click();
    helpers.expectNewTabOpen(shared.config.FORUM_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the support chat', function(done) {
    contactUsPage.chatBtn.click();
    helpers.expectNewTabOpen(shared.config.CHAT_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the support e-mail', function() {
    //help.emailBtn.click();
    // FIXME: How to verify "mailto:" links without breaking the PageObject pattern?
    expect(contactUsPage.emailBtn.getAttribute('href')).toEqual(shared.config.EMAIL_LINK);
  });
  
  
  describe('After Sign In', function() {
    beforeAll(function() {
      dashboardPage.get();
    });
    
    afterAll(function() {
      navbar.expandAccountDropdown();
      navbar.clickSignOut();
      landingPage.verify();
    });
    
    it('should link to the support forum', function(done) {
      contactUsPage.forumBtn.click();
      helpers.expectNewTabOpen(shared.config.FORUM_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the support chat', function(done) {
      contactUsPage.chatBtn.click();
      helpers.expectNewTabOpen(shared.config.CHAT_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the support e-mail', function() {
      //help.emailBtn.click();
      expect(contactUsPage.emailBtn.getAttribute('href')).toEqual(shared.config.EMAIL_LINK);
    });
  
    it('should allow the user to send a help request', function() {
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // This should be a noop, as 'Request Help' is selected by default
      contactUsPage.selectFeedbackType(OPTION_REQUEST_HELP); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // Select the "Request Help" option
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('Request Help'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  
    it('should allow the user to make a wish', function() {
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // This should be a noop, as 'Request Help' is selected by default
      contactUsPage.selectFeedbackType(OPTION_MAKE_A_WISH); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // Select the "Make a Wish" option
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('Make a Wish'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  
    it('should allow the user to anonymously make a wish', function() {
      var anonymousCheckbox = contactUsPage.feedbackAnonymousCheckbox;
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      expect(anonymousCheckbox.isEnabled()).toBe(false);
      
      // Select the "Make a Wish" option
      contactUsPage.selectFeedbackType(OPTION_MAKE_A_WISH); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      expect(anonymousCheckbox.isEnabled()).toBe(true);
      
      // Toggle the anonymous checkbox
      anonymousCheckbox.click();
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // We should not be able to click without entering text
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('Make a Wish'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  
    it('should allow the user to report a bug', function() {
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // This should be a noop, as 'Request Help' is selected by default
      contactUsPage.selectFeedbackType(OPTION_REPORT_A_BUG); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // Select the "Report a Bug" option
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('Bug Report'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  
    it('should allow the user to anonymously submit a bug report', function() {
      var anonymousCheckbox = contactUsPage.feedbackAnonymousCheckbox;
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      expect(anonymousCheckbox.isEnabled()).toBe(false);
      
      // Select the "Report a Bug" option
      contactUsPage.selectFeedbackType(OPTION_REPORT_A_BUG); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      expect(anonymousCheckbox.isEnabled()).toBe(true);
      
      // Toggle the anonymous checkbox
      anonymousCheckbox.click();
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // We should not be able to click without entering text
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('Bug Report'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  
    it('should allow the user to submit a general comment', function() {
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // Select the "General Comment" option
      contactUsPage.selectFeedbackType(OPTION_GENERAL_COMMENT); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // We should not be able to click without entering text
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('General Comment'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  
    it('should allow the user to anonymously submit a general comment', function() {
      var anonymousCheckbox = contactUsPage.feedbackAnonymousCheckbox;
      var submitBtn = contactUsPage.feedbackSubmitBtn;
      
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      expect(anonymousCheckbox.isEnabled()).toBe(false);
      
      // Select the "General Comment" option
      contactUsPage.selectFeedbackType(OPTION_GENERAL_COMMENT); 
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      expect(anonymousCheckbox.isEnabled()).toBe(true);
      
      // Toggle the anonymous checkbox
      anonymousCheckbox.click();
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(false);
      
      // We should not be able to click without entering text
      contactUsPage.feedbackMessageInput.sendKeys(generateTestMessage('General Comment'));
      expect(submitBtn.isDisplayed()).toBe(true);
      expect(submitBtn.isEnabled()).toBe(true);
      
      // TODO: How to verify support e-mails?
      //help.feedbackSubmitBtn.click();
    });
  });
});