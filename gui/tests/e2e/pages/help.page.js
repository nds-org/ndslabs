/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');

var LandingPage = require('./landing.page.js');

var PAGE_TITLE = 'Contact Labs Workbench Support';
var PAGE_ROUTE = /https?\:\/\/.+\/\#\/contact/;


// 
// feedbackTypes:
// 0 => Request Help
// 1 => Make a Wish
// 2 => Report a Bug
// 3 => General Comment
// 
var ContactUsPage = function() {
  "use strict";

  this.forumBtn = element(by.id('ggroupBtn'));
  this.chatBtn = element(by.id('gitterBtn'));
  this.emailBtn = element(by.id('emailBtn'));
  
  this.feedbackTypeSelector = element(by.id('typeField'));
  this.feedbackAnonymousCheckbox = element(by.id('anonymousInput'));
  this.feedbackMessageInput = element(by.id('messageField'));
  
  this.feedbackSubmitBtn = element(by.id('feedbackBtn'));
};

// Navigate to the Contact Us view
ContactUsPage.prototype.get = function() {
  "use strict";

  var landingPage = new LandingPage();
  
  landingPage.get();
  landingPage.clickContactUsLink();
  
  this.verify();
};

// Ensure that we are on the correct page
ContactUsPage.prototype.verify = function() { 
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Make a selection in the Feedback Type dropdown
// TODO: Can this be done without using the index?
ContactUsPage.prototype.selectFeedbackType = function(index) {
  "use strict";

  this.feedbackTypeSelector.click();
  helpers.selectDropdownbyNum(this.feedbackTypeSelector, index);
};

module.exports = ContactUsPage;
