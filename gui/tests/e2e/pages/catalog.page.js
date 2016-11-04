/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var landing = require('./landing.page.js');
var login = require('./login.page.js');
var dashboard = require('./dashboard.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Labs Workbench Catalog';
var PAGE_ROUTE = TEST_HOSTNAME + '/store';

// Ensure that we are on the correct page
module.exports.verify = function() { 
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the catalog view
module.exports.get = function(loggedIn) {
  dashboard.get(loggedIn);
  dashboard.clickCatalogLink();
  
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
