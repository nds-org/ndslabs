/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var login = require('./login.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Reset Password';
var PAGE_ROUTE = /^https\:\/\/.*\/\#\/recover(\?t=.*)?$/;

// Ensure that we are on the correct page
module.exports.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
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

/**
 * Insert private member vars here for page element IDs
 */

/**
 * Insert private Getter functions here for page elements
 */

/**
 * Insert public Getter functions here for user interactions
 */
