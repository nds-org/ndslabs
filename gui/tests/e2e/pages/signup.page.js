/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var landing = require('./landing.page.js');
var login = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Sign Up for Labs Workbench';
var PAGE_ROUTE = TEST_HOSTNAME + '/register';

// IDs for page elements
var INPUT_FULLNAME_ID = 'fullName';
var INPUT_EMAIL_ID = 'email';
var INPUT_ORGANIZATION_ID = 'organization';
var INPUT_DESCRIPTION_ID = 'description';
var INPUT_USERNAME_ID = 'namespace';
var INPUT_PASSWORD_ID = 'password';
var INPUT_CONFIRM_PASSWORD_ID = 'passwordConf';
var LINK_USE_POLICY_ID = 'usePolicyLink';

var fullNameInput = function() {  return element(by.id(INPUT_FULLNAME_ID)); };
var emailInput = function() {  return element(by.id(INPUT_EMAIL_ID)); };
var organizationInput = function() {  return element(by.id(INPUT_ORGANIZATION_ID)); };
var descriptionInput = function() {  return element(by.id(INPUT_DESCRIPTION_ID)); };
var usernameInput = function() {  return element(by.id(INPUT_USERNAME_ID)); };
var passwordInput = function() {  return element(by.id(INPUT_PASSWORD_ID)); };
var passwordConfirmInput = function() {  return element(by.id(INPUT_CONFIRM_PASSWORD_ID)); };

var usePolicyLink = function() {  return element(by.id(LINK_USE_POLICY_ID)); };

// TODO: change this to id selector
var submitBtn = function() {  return element(by.css('[ng-click="signUp(newProject)"]')); };

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

module.exports.enterFullName = function(text) {
  fullNameInput().sendKeys(text);
};

module.exports.enterEmail = function(text) {
  emailInput().sendKeys(text);
};

module.exports.enterOrganization = function(text) {
  organizationInput().sendKeys(text);
};

module.exports.enterDescription = function(text) {
  descriptionInput().sendKeys(text);
};

module.exports.enterUsername = function(text) {
  usernameInput().sendKeys(text);
};

module.exports.enterPassword = function(text) {
  passwordInput().sendKeys(text);
};

module.exports.enterPasswordConfirmation = function(text) {
  passwordConfirmInput().sendKeys(text);
};

module.exports.clickSubmit = function() {
  submitBtn().click();
};

module.exports.clickUsePolicyLink = function() {
  usePolicyLink().click();
};