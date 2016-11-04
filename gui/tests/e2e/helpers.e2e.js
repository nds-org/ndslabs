/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

// This module exports shared generic helper functions that do not reference particular page element
module.exports = {};

// Debug Only: Sleep for the given number of milliseconds.
// WARNING: This should not be used in production
module.exports.sleep = function(ms) {
  var startTime = new Date().getTime();
  while(new Date().getTime() < startTime + ms) { /* noop */ }
};

// Scroll to the given x,y coordinates, then execute the predicate function
module.exports.scrollToAndThen = function(x, y, predicate) {
  return browser.executeScript('window.scrollTo(' + x.toString() + ',' + y.toString() + ');').then(predicate);
};

// Ensure that the desired input exists and is visible, then return it
module.exports.getInput = function(selector) {
  var input = element(selector);
  expect(input.isPresent()).toBe(true);
  expect(input.isDisplayed()).toBe(true);
  return input;
};

// Check that a new tab is open and, if second param is true, close the tab afterward
module.exports.expectNewTabOpen = function(expectedUrl, leaveOpen) {
  browser.ignoreSynchronization = true;
  
  // Retrieve all open window handles
  browser.getAllWindowHandles().then(function (handles) {
    // Switch to new tab and verify that its URL is correct
    browser.driver.switchTo().window(handles[1]);
    expect(browser.getCurrentUrl()).toBe(expectedUrl);
    
    if (!leaveOpen) {
      // Close current tab and switch back to original
      browser.driver.close();
      browser.driver.switchTo().window(handles[0]);
    }
  });
};

// Misc setup to run before ALL test cases
module.exports.beforeAll = function() {
  // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
  // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
  browser.driver.manage().window().setSize(1280, 1024);
};

// Misc setup to run before EACH test case
module.exports.beforeEach = function() {  };

// Misc setup to run after EACH test case
module.exports.afterEach = function() {
  browser.ignoreSynchronization = false;
};

// Misc setup to run after ALL test cases
module.exports.afterAll = function() {  };