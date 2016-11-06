/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var login = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Reset Password';
var PAGE_ROUTE = /^https\:\/\/.*\/\#\/recover(\?t=.*)?$/;

var INPUT_USERNAME_ID = 'accountId';
var HELPERTEXT_EMAIL_SENT_ID = 'emailSentHelperText';
var INPUT_NEW_PASSWORD_ID = 'password';
var INPUT_NEW_PASSWORD_CONFIRMATION_ID = 'passwordConf';
var HELPERTEXT_PASS_CHANGED_ID = 'passwordChangedHelperText';

var usernameInput = function() {  return element(by.id(INPUT_USERNAME_ID)); };
var emailSentHelperText = function() {  return element(by.id(HELPERTEXT_EMAIL_SENT_ID)); };
var newPasswordInput = function() {  return element(by.id(INPUT_NEW_PASSWORD_ID)); };
var newPasswordConfirmationInput = function() {  return element(by.id(INPUT_NEW_PASSWORD_CONFIRMATION_ID)); };
var passwordChangedHelperText = function() {  return element(by.id(HELPERTEXT_PASS_CHANGED_ID)); };


// Ensure that everything looks correct on the page, provided the given state parameters
module.exports.verify = function(showHelperText, loggedIn) { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
  
  if (showHelperText) {
    if (loggedIn) {
      helpers.expectElement(passwordChangedHelperText());
    } else {
      
    }
  }
};

// Navigate to the Reset Password view
module.exports.get = function(loggedIn) {
  if (loggedIn) {
    shared.navbar.expandAccountDropdown();
    shared.navbar.clickChangePasswordNav();
  } else {
    login.get();
    login.clickForgotPasswordLink();
  }
    
  module.exports.verify();
};

module.exports.enterUsername = function(text) {
  usernameInput().sendKeys(text);
};

module.exports.enterNewPassword = function(text) {
  newPasswordInput().sendKeys(text);
};

module.exports.enterNewPasswordConfirmation = function(text) {
  newPasswordConfirmationInput().sendKeys(text);
};
