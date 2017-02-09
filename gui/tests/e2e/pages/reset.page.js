/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');
var Navbar = require('./navbar.page.js');

var LoginPage = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Reset Password';
var PAGE_ROUTE = /^https?\:\/\/.*\/\#\/recover(\?t=.+)?$/;

var ResetPasswordPage = function() {
  "use strict";

  this.usernameInput = element(by.id('accountId'));
  this.submitUsernameBtn = element(by.id('submitUsernameBtn'));
  
  this.emailSentHelperText = element(by.id('emailSentHelperText'));
  
  this.newPasswordInput = element(by.id('password'));
  this.newPasswordConfirmationInput = element(by.id('passwordConf'));
  this.submitPasswordBtn = element(by.id('submitPasswordBtn'));
  
  this.passwordChangedHelperText = element(by.id('passwordChangedHelperText'));
};

// Navigate to the Reset Password view
ResetPasswordPage.prototype.get = function(loggedIn) {
  "use strict";

  var navbar = new Navbar();
  var loginPage = new LoginPage();
  
  if (loggedIn) {
    navbar.accountDropdown.click();
    navbar.changePasswordNav.click();
  } else {
    loginPage.get();
    loginPage.forgotPasswordLink.click();
  }
    
  this.verify();
};

// Ensure that everything looks correct on the page, provided the given state parameters
ResetPasswordPage.prototype.verify = function(showHelperText, loggedIn) { 
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
  
  /*if (showHelperText) {
    if (loggedIn) {
      helpers.expectElement(this.passwordChangedHelperText);
    } else {
      
    }
  }*/
};

module.exports = ResetPasswordPage;
