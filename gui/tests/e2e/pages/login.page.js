/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other pages
var Navbar = require('./navbar.page.js');
var LandingPage = require('./landing.page.js');

var PAGE_TITLE = 'Sign In to Labs Workbench';
var PAGE_ROUTE = /\/\#\/login/;

var LoginPage = function() {
  this.loginBtn = element(by.id('loginBtn'));
  this.usernameInput = element(by.id('inputNamespace'));
  this.passwordInput = element(by.id('inputPassword'));
  this.requestAccessLink = element(by.id('requestAccessLink'));
  this.forgotPasswordLink = element(by.id('forgotPasswordLink'));
};

// Navigate to the Login view
LoginPage.prototype.get = function() {
  var landingPage = new LandingPage();
  var navbar = new Navbar();
  
  landingPage.get();
  navbar.clickSignIn();
  this.verify();
};

// Ensure that we are on the login page
LoginPage.prototype.verify = function() {
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

LoginPage.prototype.enterUsername = function(text) {
  this.usernameInput.sendKeys(text);
};
  
LoginPage.prototype.enterPassword = function(text) {
  this.passwordInput.sendKeys(text);
};

LoginPage.prototype.clickLogin = function() {
  this.loginBtn.click();
};
  
LoginPage.prototype.clickRequestAccessLink = function() {
  this.requestAccessLink.click();
};
  
LoginPage.prototype.clickForgotPasswordLink = function() {
  this.forgotPasswordLink.click();
};

module.exports = LoginPage;