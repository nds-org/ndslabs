/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var SignUpPage = require('./pages/signup.page.js');
var LandingPage = require ('./pages/landing.page.js');

// Valid test data
var TEST_NEW_FULLNAME = shared.config.TEST_NEW_FULLNAME;
var TEST_NEW_EMAIL = shared.config.TEST_NEW_EMAIL;
var TEST_NEW_ORGANIZATION = shared.config.TEST_NEW_ORGANIZATION;
var TEST_NEW_DESCRIPTION = shared.config.TEST_NEW_DESCRIPTION;
var TEST_NEW_USERNAME = shared.config.TEST_NEW_USERNAME;
var TEST_NEW_PASSWORD = shared.config.TEST_PASSWORD;      // Reuse the same password for simplicity

// Invalid test data (for testing error handling)
var TEST_INVALID_EMAIL_REGISTERED = shared.config.TEST_EMAIL;         // E-mail that is already registered
var TEST_INVALID_USERNAME_REGISTERED = shared.config.TEST_USERNAME;   // Username is already registered
var TEST_INVALID_PASSWORD_TOOSHORT = shared.config.TEST_INVALID_PASSWORD_TOOSHORT; // Password is too short
var TEST_INVALID_PASSWORD_MISMATCH = shared.config.TEST_INVALID_PASSWORD_MISMATCH; // Password is incorrect

// signUpPage.e2e.js
describe('Labs Workbench Sign Up View', function() {
  "use strict";

  var landingPage = new LandingPage();
  var signUpPage = new SignUpPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    signUpPage.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  // FIXME: Figure out how to automate account approval workflow
  var expectBtn = function(enabled) {
    var submitBtn = signUpPage.submitBtn;
    helpers.scrollIntoView(submitBtn);
    expect(submitBtn.isDisplayed()).toBe(true);
    expect(submitBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
  };
  
  it('should link to the "Acceptable Use Policy" wiki page', function(){ 
    helpers.scrollToAndThen(0, 10000, function() {
      signUpPage.clickUsePolicyLink();
      helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK);
    });
  });
  
  it('should allow submission with valid information', function() {
    // All fields are required
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    
    // Scroll down to the second half of the form
    helpers.scrollIntoView(signUpPage.submitBtn);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(true);
  });
  
  it('should require user to enter a name', function() {
    // Do not enter a name
    signUpPage.enterFullName('');
    
    // All other fields are valid
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    
    // Scroll down to the second half of the form
    helpers.scrollIntoView(signUpPage.submitBtn);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter an email', function() {
    // Do not enter an email address
    signUpPage.enterEmail('');
    
    // All other fields are valid
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    
    // Scroll down to the second half of the form
    helpers.scrollIntoView(signUpPage.submitBtn);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter an organization', function() {
    // Do not enter an organization
    signUpPage.enterOrganization('');
    
    // All other fields are valid
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a description', function() {
    // Do not enter a description
    signUpPage.enterDescription('');
    
    // All other fields are valid
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a username', function() {
    // Do not enter a description
    signUpPage.enterUsername('');
    
    // All other fields are valid
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    
    // Passwords must match
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a password', function() {
    // Do not enter a description
    signUpPage.enterPassword('');
    
    // All other fields are valid
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a password confirmation', function() {
    // Do not enter a password confirmation
    signUpPage.enterPasswordConfirmation('');
    
    // All other fields are valid
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should not allow submission with a previously registered username', function() {
    // Reuse a username that has already been registered
    signUpPage.enterUsername(TEST_INVALID_USERNAME_REGISTERED);
    
    // All other fields are valid
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // We should be able to click submit
    helpers.scrollToAndThen(0, 10000, function() {
      // Our request should fail, since this username is already registered
      signUpPage.clickSubmit();
      signUpPage.verify();
    });
  });
  
  it('should not allow submission with a previously registered e-mail address', function() {
    // Reuse an email that has already been registered
    signUpPage.enterEmail(TEST_INVALID_EMAIL_REGISTERED);
    
    // All other fields are valid
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    helpers.scrollToAndThen(0, 10000, function() {
      // Our request should fail, since this e-mail is already registered
      signUpPage.clickSubmit();
      signUpPage.verify();
    });
  });
  
  it('should require password to match confirmation', function() {
    // All fields are required
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    signUpPage.enterPassword(TEST_NEW_PASSWORD);
    signUpPage.enterPasswordConfirmation(TEST_INVALID_PASSWORD_MISMATCH);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require password to be longer than 6 characters', function() {
    // All fields are required
    signUpPage.enterFullName(TEST_NEW_FULLNAME);
    signUpPage.enterEmail(TEST_NEW_EMAIL);
    signUpPage.enterOrganization(TEST_NEW_ORGANIZATION);
    signUpPage.enterDescription(TEST_NEW_DESCRIPTION);
    signUpPage.enterUsername(TEST_NEW_USERNAME);
    signUpPage.enterPassword(TEST_INVALID_PASSWORD_TOOSHORT);
    signUpPage.enterPasswordConfirmation(TEST_INVALID_PASSWORD_TOOSHORT);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
});