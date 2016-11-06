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

var BUTTON_CREATE_APPLICATION_ID = 'createApplicationBtn';

var createApplicationBtn = function() {  return element(by.id(BUTTON_CREATE_APPLICATION_ID)); };

// Ensure that we are on the correct page
module.exports.verify = function() { 
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the addSpec view
module.exports.get = function(loggedIn) {
  dashboard.get(loggedIn);
  shared.navbar.clickCatalogNav();
  
  module.exports.verify();
};

module.exports.clickCreateButton = function() {
	createApplicationBtn().click();
};