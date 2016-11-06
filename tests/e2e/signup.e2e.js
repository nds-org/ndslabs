/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var signup = require('./pages/signup.page.js');
var landing = require ('./pages/landing.page.js');

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

// signup.e2e.js
describe('Labs Workbench Sign Up View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    signup.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  // FIXME: Figure out how to automate account approval workflow
  var submitBtn = function() {  return element(by.css('[ng-click="signUp(newProject)"]')); };
  
  var expectBtn = function(enabled) {
    expect(submitBtn().isDisplayed()).toBe(true);
    expect(submitBtn().isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
  };
  
  it('should link to the "Acceptable Use Policy" wiki page', function(){ 
    signup.clickUsePolicyLink();
    helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK);
  });
  
  it('should allow submission with valid information', function() {
    // All fields are required
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(true);
  });
  
  it('should require user to enter a name', function() {
    // Do not enter a name
    signup.enterFullName('');
    
    // All other fields are valid
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter an email', function() {
    // Do not enter an email address
    signup.enterEmail('');
    
    // All other fields are valid
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter an organization', function() {
    // Do not enter an organization
    signup.enterOrganization('');
    
    // All other fields are valid
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a description', function() {
    // Do not enter a description
    signup.enterDescription('');
    
    // All other fields are valid
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterUsername(TEST_NEW_USERNAME);
    
    // Passwords must match
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a username', function() {
    // Do not enter a description
    signup.enterUsername('');
    
    // All other fields are valid
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    
    // Passwords must match
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a password', function() {
    // Do not enter a description
    signup.enterPassword('');
    
    // All other fields are valid
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require user to enter a password confirmation', function() {
    // Do not enter a password confirmation
    signup.enterPasswordConfirmation('');
    
    // All other fields are valid
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    signup.enterPassword(TEST_NEW_PASSWORD);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should not allow submission with a previously registered username', function() {
    // Reuse a username that has already been registered
    signup.enterUsername(TEST_INVALID_USERNAME_REGISTERED);
    
    // All other fields are valid
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // We should be able to click submit
    signup.clickSubmit();
    
    // Our request should fail, since this username is already registered
    signup.verify();
  });
  
  it('should not allow submission with a previously registered email address', function() {
    // Reuse an email that has already been registered
    signup.enterEmail(TEST_INVALID_EMAIL_REGISTERED);
    
    // All other fields are valid
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_NEW_PASSWORD);
    
    // We should be able to click submit
    signup.clickSubmit();
    
    // Our request should fail, since this email is already registered
    signup.verify();
  });
  
  it('should require password to match confirmation', function() {
    // All fields are required
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    signup.enterPassword(TEST_NEW_PASSWORD);
    signup.enterPasswordConfirmation(TEST_INVALID_PASSWORD_MISMATCH);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
  
  it('should require password to be longer than 6 characters', function() {
    // All fields are required
    signup.enterFullName(TEST_NEW_FULLNAME);
    signup.enterEmail(TEST_NEW_EMAIL);
    signup.enterOrganization(TEST_NEW_ORGANIZATION);
    signup.enterDescription(TEST_NEW_DESCRIPTION);
    signup.enterUsername(TEST_NEW_USERNAME);
    signup.enterPassword(TEST_INVALID_PASSWORD_TOOSHORT);
    signup.enterPasswordConfirmation(TEST_INVALID_PASSWORD_TOOSHORT);
    
    // FIXME: Figure out how to automate account approval workflow
    expectBtn(false);
  });
});