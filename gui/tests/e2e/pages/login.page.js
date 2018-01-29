/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

module.exports = {};

// Load other pages
var Navbar = require('./navbar.page.js');
var LandingPage = require('./landing.page.js');
var shared = require('./shared.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;
var PAGE_TITLE = /*'Sign In to */ 'Labs Workbench';
var PAGE_ROUTE = /https?\:\/\/.+\/login\/\#?\/?/;

var LoginPage = function() {
  "use strict";

  this.loginBtn = element(by.id('loginBtn'));
  this.usernameInput = element(by.id('inputNamespace'));
  this.passwordInput = element(by.id('inputPassword'));
  this.requestAccessLink = element(by.id('requestAccessLink'));
  this.forgotPasswordLink = element(by.id('forgotPasswordLink'));
};

// Navigate to the Login view
LoginPage.prototype.get = function() {
  "use strict";

  var landingPage = new LandingPage();
  var navbar = new Navbar();
  
  //landingPage.get();
  //navbar.clickSignIn();
  browser.get(TEST_HOSTNAME + '/login/');
  this.verify();
};

// Ensure that we are on the login page
LoginPage.prototype.verify = function() {
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

LoginPage.prototype.enterUsername = function(text) {
  "use strict";

  this.usernameInput.sendKeys(text);
};
  
LoginPage.prototype.enterPassword = function(text) {
  "use strict";

  this.passwordInput.sendKeys(text);
};

LoginPage.prototype.clickLogin = function() {
  "use strict";

  this.loginBtn.click();
};
  
LoginPage.prototype.clickRequestAccessLink = function() {
  "use strict";

  this.requestAccessLink.click();
};
  
LoginPage.prototype.clickForgotPasswordLink = function() {
  "use strict";

  this.forgotPasswordLink.click();
};

module.exports = LoginPage;