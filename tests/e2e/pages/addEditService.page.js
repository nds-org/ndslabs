/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "service name" in title?
// TODO: How to handle "stackServiceId" in url?
var PAGE_TITLE = 'Add Service: ';
var PAGE_ROUTE = TEST_HOSTNAME + '/home/stackid/specid/add';

// Ensure that we are on the correct page
module.exports.verify = function() { 
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

module.exports.get = function(loggedIn) {
  dashboard.get(loggedIn);
	
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
