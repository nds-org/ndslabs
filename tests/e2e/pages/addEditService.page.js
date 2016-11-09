/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

// Load other modules
var shared = require('./shared.page.js');

var DashboardPage = require('./dashboard.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "service name" in title?
// TODO: How to handle "stackServiceId" in url?
var PAGE_TITLE = /Add Service/;
var PAGE_ROUTE = /https\:\/\/.+\/\#\/home\/.+\/add\/.+/;

var AddServicePage = function() {
  /**
   * Insert public Getters here for page elements
   */
};

// Navigate to the App Service view
AddServicePage.prototype.get = function(loggedIn) {
  var dashboardPage = new DashboardPage();
  dashboardPage.get(loggedIn);
	
  this.verify();
};

// Ensure that we are on the correct page
AddServicePage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};


/**
 * Insert public functions here for user actions
 */

module.exports = AddServicePage;