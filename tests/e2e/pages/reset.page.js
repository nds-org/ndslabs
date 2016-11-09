/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');
var Navbar = require('./login.page.js');

var LoginPage = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Reset Password';
var PAGE_ROUTE = /^https\:\/\/.*\/\#\/recover(\?t=.*)?$/;

var ResetPasswordPage = function() {
  this.usernameInput = element(by.id('accountId'));
  this.emailSentHelperText = element(by.id('emailSentHelperText'));
  this.newPasswordInput = element(by.id('password'));
  this.newPasswordConfirmationInput = element(by.id('passwordConf'));
  this.passwordChangedHelperText = element(by.id('passwordChangedHelperText'));
};

// Navigate to the Reset Password view
ResetPasswordPage.prototype.get = function(loggedIn) {
  var navbar = new Navbar();
  var loginPage = new LoginPage();
  
  if (loggedIn) {
    navbar.expandAccountDropdown();
    navbar.clickChangePasswordNav();
  } else {
    loginPage.get();
    loginPage.clickForgotPasswordLink();
  }
    
  this.verify();
};

// Ensure that everything looks correct on the page, provided the given state parameters
ResetPasswordPage.prototype.verify = function(showHelperText, loggedIn) { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
  
  if (showHelperText) {
    if (loggedIn) {
      helpers.expectElement(this.passwordChangedHelperText);
    } else {
      
    }
  }
};

ResetPasswordPage.prototype.enterUsername = function(text) {
  this.usernameInput.sendKeys(text);
};

ResetPasswordPage.prototype.enterNewPassword = function(text) {
  this.newPasswordInput.sendKeys(text);
};

ResetPasswordPage.prototype.enterNewPasswordConfirmation = function(text) {
  this.newPasswordConfirmationInput.sendKeys(text);
};

module.exports = ResetPasswordPage;