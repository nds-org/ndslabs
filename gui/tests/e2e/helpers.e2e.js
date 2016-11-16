/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

var fs = require('fs');

// This module exports shared generic helper functions that do not reference particular page element
module.exports = {};

// Debug Only: Sleep for the given number of milliseconds.
// WARNING: This should not be used in production
module.exports.sleep = function(ms) {
  var startTime = new Date().getTime();
  while(new Date().getTime() < startTime + ms) { /* noop */ }
};

/*
Example:
Executing:
selectByModel(catalogPage.cards, "spec.key", function(key) { return key === 'toolmanager' }, function(cards) {  });

Will execute:
catalogPage.cards.filter(function (card) {
      return card.evaluate("spec.key").then(function (key) {
          return key == target;
      });
    }).then(function (matches) {
      if (matches) {  // we have a match - find and click the Add button
        matches[0].element(by.id('addBtn')).click();
      }
    })

*/
module.exports.selectByModel = function(src, binding, matcher, predicate) {
  //console.log("Searching for " + binding.toString() + " with matcher " + matcher.toString() +  " in " + src.toString());
  return src.filter(function (card) {
    return card.evaluate(binding).then(matcher);
  }).then(function(matches) {
    if (!predicate) {
      console.log("WARNING: No predicate defined... skipping...");
      return;
    }
    
    if (matches.length > 1) {
      console.log("WARNING: more than one element found for given matcher - executing pedicate on the first match: " + matcher.toString());
    }
    
    //console.log("Executing predicate: " + predicate.toString());
    if (matches && matches.length > 0) {
      //console.log("Match: " + matches[0].toString());
      return predicate(matches[0]);
    } else {
      console.log("WARNING: no elements found for given matcher - executing pedicate without arguments: " + matcher.toString());
      return predicate();
    }
  });
};

// Save a screenshot of the browser's current state to the given file (helpful for failing tests)
module.exports.saveScreenshotToFile = function(filename) {
  browser.takeScreenshot().then(function (png) {
    var stream = fs.createWriteStream(filename);
    stream.write(new Buffer(png, 'base64'));
    stream.end();
  });
};

module.exports.waitForThenClick = function(ele, timeout) {
  var isClickableConf = protractor.ExpectedConditions.elementToBeClickable(ele);
  browser.wait(isClickableConf, timeout || 5000);
  ele.click();
};

// Scroll to the given x,y coordinates, then execute the predicate function
module.exports.scrollToAndThen = function(x, y, predicate) {
  return browser.executeScript('window.scrollTo(' + x.toString() + ',' + y.toString() + ');').then(predicate);
};

// Scroll to the given WebElement, then execute the predicate function
module.exports.scrollIntoViewAndClick = function(ele) {
  //return browser.actions().mouseMove(ele).perform();
  return browser.executeScript('arguments[0].scrollIntoView()', ele.getWebElement());
};

module.exports.hasClass = function (ele, clazz) {
  return ele.getAttribute('class').then(function (classes) {
      return classes.split(' ').indexOf(clazz) !== -1;
  });
};

// Ensure that the desired element exists and is visible, then return it
module.exports.expectElement = function(selector) {
  var ele = element(selector);
  if (ele.isPresent) { expect(ele.isPresent()).toBe(true); }
  if (ele.isDisplayed) { expect(ele.isDisplayed()).toBe(true); }
  if (ele.isEnabled) { expect(ele.isEnabled()).toBe(true); }
  return ele;
};

// Check that a new tab is open and close the tab
// If second param is false, the tab is left open
module.exports.expectNewTabOpen = function(expectedUrl, leaveOpen) {
  // This is required if our new page is not an AngularJS page
  browser.ignoreSynchronization = true;
  
  // Retrieve all open window handles
  browser.getAllWindowHandles().then(function (handles) {
    if (handles.length <= 1) {
      return;
    }
    
    // Switch to newest tab and verify that its URL is correct
    browser.driver.switchTo().window(handles[handles.length - 1]);
    if (expectedUrl instanceof RegExp) {
      expect(browser.getCurrentUrl()).toMatch(expectedUrl);
    } else if (typeof expectedUrl === 'string') {
      expect(browser.getCurrentUrl()).toBe(expectedUrl);
    }
    
    if (!leaveOpen) {
      // Close current tab and switch back to original
      browser.driver.close();
      browser.driver.switchTo().window(handles[0]);
    }
  });
};

module.exports.selectDropdownbyNum = function (ele, index) {
  if (index){
    var options = ele.all(by.tagName('option'))   
      .then(function(options){
        options[index].click();
      });
  }
};

// Misc shared setup to run before ALL test cases
module.exports.beforeAll = function() {  
  // Clear all cookies - this will ensure we are logged out at the start of our tests
  // TODO: I haven't had any fail for this reason, but it seems like an edge case we should watch for
  // browser.driver.manage().deleteAllCookies();
  
  // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
  // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
  browser.driver.manage().window().setSize(1280, 1024);
  //browser.driver.manage().window().maximize();
  
  // Disable CSS Animations
  // See http://stackoverflow.com/questions/26584451/how-to-disable-animations-in-protractor-for-angular-js-application/32264842#32264842
  browser.executeScript("document.body.className += ' notransition';");
};

// Misc shared setup to run before EACH test case
module.exports.beforeEach = function() {  };

// Misc shared setup to run after EACH test case
module.exports.afterEach = function() {
  browser.ignoreSynchronization = false;
};

// Misc shared setup to run after ALL test cases
module.exports.afterAll = function() {  };