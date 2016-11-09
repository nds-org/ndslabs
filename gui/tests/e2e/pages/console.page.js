/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

var PAGE_TITLE = /Service Console: .*/;
var PAGE_ROUTE = /https\:\/\/.*\/\#\/home\/.*\/console/;

var ConsolePage = function() {
  /**
   * Insert public Getters here for page elements
   */
};

// Navigate to the Console view
// TODO: How to handle parameters here?
ConsolePage.prototype.get = function(appId, serviceId, loggedIn) {
  this.verify();
};

// Ensure that we are on the correct page
ConsolePage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};

/**
 * Insert public functions here for user interactions
 */

module.exports = ConsolePage;