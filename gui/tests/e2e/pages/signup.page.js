/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var LoginPage = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Sign Up for Labs Workbench';
var PAGE_ROUTE = TEST_HOSTNAME + '/register';


var SignUpPage = function() {
  this.fullNameInput = element(by.id('fullName'));
  this.emailInput = element(by.id('email'));
  this.organizationInput = element(by.id('organization'));
  this.descriptionInput = element(by.id('description'));
  this.usernameInput = element(by.id('namespace'));
  this.passwordInput = element(by.id('password'));
  this.passwordConfirmInput = element(by.id('passwordConf'));
  
  this.usePolicyLink = element(by.id('usePolicyLink'));
  
  this.submitBtn = element(by.id('submitBtn'));
};
 
// Navigate to the Sign Up view
SignUpPage.prototype.get = function() {
  var loginPage = new LoginPage();
  
  loginPage.get();
  loginPage.clickRequestAccessLink();
  
  this.verify();
};

// Ensure that we are on the correct page
SignUpPage.prototype.verify = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

SignUpPage.prototype.enterFullName = function(text) {
  this.fullNameInput.sendKeys(text);
};

SignUpPage.prototype.enterEmail = function(text) {
  this.emailInput.sendKeys(text);
};

SignUpPage.prototype.enterOrganization = function(text) {
  this.organizationInput.sendKeys(text);
};

SignUpPage.prototype.enterDescription = function(text) {
  this.descriptionInput.sendKeys(text);
};

SignUpPage.prototype.enterUsername = function(text) {
  this.usernameInput.sendKeys(text);
};

SignUpPage.prototype.enterPassword = function(text) {
  this.passwordInput.sendKeys(text);
};

SignUpPage.prototype.enterPasswordConfirmation = function(text) {
  this.passwordConfirmInput.sendKeys(text);
};

SignUpPage.prototype.clickSubmit = function() {
  this.submitBtn.click();
};

SignUpPage.prototype.clickUsePolicyLink = function() {
  this.usePolicyLink.click();
};

module.exports = SignUpPage;