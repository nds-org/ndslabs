/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var landing = require('./landing.page.js');
var login = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Sign Up for Labs Workbench';
var PAGE_ROUTE = TEST_HOSTNAME + '/register';

// Valid test data
var TEST_NEW_FULLNAME = 'Jane Doe';
var TEST_NEW_EMAIL = 'jane.doe@fakeemailserver.com';
var TEST_NEW_ORGANIZATION = 'NDS';
var TEST_NEW_DESCRIPTION = 'Description';
var TEST_NEW_USERNAME = 'protractore2etests';
var TEST_NEW_PASSWORD = shared.config.TEST_PASSWORD;         // Reuse the same password

// Invalid test data (for testing error handling)
var TEST_INVALID_NEW_USERNAME = shared.config.TEST_USERNAME; // Username is already taken
var TEST_INVALID_NEW_PASSWORD = '123';                       // Password is too short
var TEST_UNMATCHED_NEW_PASSWORD = '654321';                  // Password is incorrect

// IDs for page elements
var INPUT_FULLNAME_ID = 'fullName';
var INPUT_EMAIL_ID = 'email';
var INPUT_ORGANIZATION_ID = 'organization';
var INPUT_DESCRIPTION_ID = 'description';
var INPUT_USERNAME_ID = 'namespace';
var INPUT_PASSWORD_ID = 'password';
var INPUT_CONFIRM_PASSWORD_ID = 'passwordConf';

var fullNameInput = function() {  return element(by.id(INPUT_FULLNAME_ID)); };
var emailInput = function() {  return element(by.id(INPUT_EMAIL_ID)); };
var organizationInput = function() {  return element(by.id(INPUT_ORGANIZATION_ID)); };
var descriptionInput = function() {  return element(by.id(INPUT_DESCRIPTION_ID)); };
var usernameInput = function() {  return element(by.id(INPUT_USERNAME_ID)); };
var passwordInput = function() {  return element(by.id(INPUT_PASSWORD_ID)); };
var passwordConfirmInput = function() {  return element(by.id(INPUT_CONFIRM_PASSWORD_ID)); };

// TODO: change this to id selector
var submitBtn = function() {  return element(by.css('[signUp(newProject)]')); };

// Ensure that we are on the correct page
module.exports.verify = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};
 
// Navigate to the Sign Up view
module.exports.get = function() { 
  login.get();
  login.clickRequestAccessLink();
  
  module.exports.verify();
};

module.exports.signUpForNewAccount = function(fail) {
  fullNameInput().sendKeys(TEST_NEW_FULLNAME);
  emailInput().sendKeys(TEST_NEW_EMAIL);
  organizationInput().sendKeys(TEST_NEW_ORGANIZATION);
  descriptionInput().sendKeys(TEST_NEW_DESCRIPTION);
  usernameInput().sendKeys(fail ? TEST_INVALID_NEW_USERNAME : TEST_NEW_USERNAME);
  passwordInput().sendKeys(TEST_NEW_PASSWORD);
  passwordConfirmInput().sendKeys(TEST_NEW_PASSWORD);
  
  submitBtn().click();
};