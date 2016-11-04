/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var landing = require('./landing.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Contact Labs Workbench Support';
var PAGE_ROUTE = TEST_HOSTNAME + '/contact';

// Ensure that we are on the correct page
module.exports.verify = function() { 
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the Contact Us view
module.exports.get = function() {
  landing.get();
  landing.clickContactUsLink();
  
  module.exports.verify();
};

// TODO: contact methods: gitter / group / e-mail
// TODO: feedback inputs: type + anon + message
