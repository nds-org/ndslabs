/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

var fs = require('fs');

var EC = protractor.ExpectedConditions;

var TIMEOUT_EXPECT_NEW_TAB = 30000;

// This module exports shared generic helper functions that do not reference particular page element
module.exports = {};

// Debug Only: Sleep for the given number of milliseconds.
// WARNING: This should not be used in production
module.exports.sleep = function(ms) {
  "use strict";

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
  "use strict";

  //console.log("Searching for " + binding.toString() + " with matcher " + matcher.toString() +  " in " + src.toString());
  return src.filter(function (card) {
    return card.evaluate(binding).then(matcher);
  }).then(function(matches) {
    if (!predicate) {
      console.log("WARNING: No predicate defined... skipping...");
      return;
    }
    
    if (matches.length > 1) {
      console.log("WARNING: more than one element found for given matcher - executing predicate on the first match: " + matcher.toString());
    }
    
    //console.log("Executing predicate: " + predicate.toString());
    if (matches && matches.length > 0) {
      //console.log("Match: " + matches[0].toString());
      return predicate(matches[0]);
    } else {
      console.log("WARNING: no elements found for given matcher - executing predicate without arguments: " + matcher.toString());
      return predicate();
    }
  });
};

// Save a screenshot of the browser's current state to the given file (helpful for failing tests)
module.exports.saveScreenshotToFile = function(filename) {
  "use strict";

  browser.takeScreenshot().then(function (png) {
    var stream = fs.createWriteStream(filename);
    stream.write(new Buffer(png, 'base64'));
    stream.end();
  });
};

module.exports.waitForThenClick = function(ele, timeout) {
  "use strict";

  browser.wait(EC.elementToBeClickable(ele), timeout || 5000);
  ele.click();
};

// Scroll to the given x,y coordinates, then execute the predicate function
module.exports.scrollToAndThen = function(x, y, predicate) {
  "use strict";

  return browser.executeScript('window.scrollTo(' + x.toString() + ',' + y.toString() + ');').then(predicate);
};

// Scroll to the given WebElement, then execute the predicate function
module.exports.scrollIntoView = function(ele) {
  "use strict";

  //return browser.actions().mouseMove(ele).perform();
  return browser.executeScript('arguments[0].scrollIntoView()', ele.getWebElement());
  //return browser.executeScript("arguments[0].scrollIntoView(false);", ele.getWebElement());
};

module.exports.hasClass = function (ele, clazz) {
  "use strict";

  return ele.getAttribute('class').then(function (classes) {
      //console.log("Looking for "+clazz+" -> "+classes)
      return classes.split(' ').indexOf(clazz) !== -1;
  });
};

// Ensure that the desired element exists and is visible, then return it
module.exports.expectElement = function(selector) {
  "use strict";

  var ele = element(selector);
  if (ele.isPresent) { expect(ele.isPresent()).toBe(true); }
  if (ele.isDisplayed) { expect(ele.isDisplayed()).toBe(true); }
  if (ele.isEnabled) { expect(ele.isEnabled()).toBe(true); }
  return ele;
};

// Check that a new tab is open and close the tab
// If second param is false, the tab is left open
module.exports.expectNewTabOpen = function(expectedUrl, leaveOpen) {
  "use strict";

  // Let AngularJS finish working first
  browser.waitForAngular();
  
  // This is required if our new page is not an AngularJS page
  browser.ignoreSynchronization = true;
  
  // Retrieve all open window handles
  return browser.getAllWindowHandles().then(function (handles) {
    if (handles.length === 1) {
      // NOOP
      return;
    }
    
    // Save original handle
    var newestHandle = handles[handles.length - 1];
    
    // Switch to newest tab and verify that its URL is correct
    return browser.driver.switchTo().window(newestHandle).then(function() {
      if (expectedUrl instanceof RegExp) {
        //browser.wait(EC.urlIs(expectedUrl), TIMEOUT_EXPECT_NEW_TAB);
        expect(browser.getCurrentUrl()).toMatch(expectedUrl);
      } else if (typeof expectedUrl === 'string') {
        browser.wait(EC.urlIs(expectedUrl), TIMEOUT_EXPECT_NEW_TAB);
        expect(browser.getCurrentUrl()).toBe(expectedUrl);
      }
      
      browser.ignoreSynchronization = false;
    }).then(function() {
      if (!leaveOpen) {
        // Close current tab and switch back to original
        return module.exports.closeTab(handles[0]);
      }
    });
  });
};

module.exports.closeTab = function(originalHandle) {
  "use strict";

  browser.driver.close();
  browser.driver.switchTo().window(originalHandle);
};

module.exports.selectDropdownbyNum = function (ele, index) {
  "use strict";

  if (index || index === 0) {
    var options = ele.all(by.tagName('option'))   
      .then(function(options){
        options[index].click();
      });
  }
};

// Misc shared setup to run before ALL test cases
module.exports.beforeAll = function() {  
  "use strict";

  // Clear all cookies - this will ensure we are logged out at the start of our tests
  // TODO: I haven't had any fail for this reason, but it seems like an edge case we should watch for
  // browser.driver.manage().deleteAllCookies();
  
  // XXX: Maximizing the window does not resolve the "Element is not clickable at point (x,y)" issue for OSX
  //browser.driver.manage().window().maximize();
  
  // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
  // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
  browser.driver.manage().window().setSize(1280, 1024);
  
  // Disable CSS Animations
  // See http://stackoverflow.com/questions/26584451/how-to-disable-animations-in-protractor-for-angular-js-application/32264842#32264842
  browser.executeScript("document.body.className += ' notransition';");
};

// Misc shared setup to run before EACH test case
module.exports.beforeEach = function() {
  "use strict";
};

// Misc shared setup to run after EACH test case
module.exports.afterEach = function() {
  "use strict";

  browser.ignoreSynchronization = false;
};

// Misc shared setup to run after ALL test cases
module.exports.afterAll = function() { 
  "use strict";
};
