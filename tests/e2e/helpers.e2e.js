/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

// This module exports shared generic helper functions that do not reference particular page element
module.exports = {};

module.exports.getInput = function(selector) {
  var input = element(selector);
  expect(input.isPresent()).toBe(true);
  expect(input.isDisplayed()).toBe(true);
  return input;
};

module.exports.expectNewTabOpenOnClick = function(expectedUrl, andClose) {
  browser.ignoreSynchronization = true;
  
  // Retrieve all open window handles
  browser.getAllWindowHandles().then(function (handles) {
    // Switch to new tab and verify that its URL is correct
    browser.driver.switchTo().window(handles[1]);
    expect(browser.getCurrentUrl()).toBe(expectedUrl);
    
    if (andClose) {
        // Close current tab and switch back to original
        browser.driver.close();
        browser.driver.switchTo().window(handles[0]);
    }
  });
};

module.exports.beforeAll = function() {
  // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
  // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
  browser.driver.manage().window().setSize(1280, 1024);
};

module.exports.beforeEach = function() {
  module.exports.startOnLandingView();
};

module.exports.afterEach = function() {
  browser.ignoreSynchronization = false;
};

module.exports.afterAll = function() { };