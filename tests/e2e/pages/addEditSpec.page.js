/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var CatalogPage = require('./catalog.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "spec name" in title?
// TODO: How to handle "id" in url?
var PAGE_TITLE = /Add Application/;
var PAGE_ROUTE = /https\:\/\/.+\/\#\/store\/add/;

var AddSpecPage = function() {
  
};

// Navigate to the Add Spec view
AddSpecPage.prototype.get = function(loggedIn) {
  var catalogPage = new CatalogPage();
  catalogPage.get(loggedIn);
  catalogPage.createButton.click();
	
  this.verify();
};

// Ensure that we are on the correct page
AddSpecPage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
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

module.exports = AddSpecPage;