/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

module.exports = {};

var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;
var PAGE_TITLE = 'Labs Workbench'; // Landing Page';
var PAGE_ROUTE = /https?\:\/\/.+\/landing\/\#?\/?/;

var LandingPage = function() {
  "use strict";

  this.learnMoreBtn = element(by.id('learnMoreBtn'));
  this.signInBtn = element(by.id('signInBtn'));
  this.signUpBtn = element(by.id('signUpBtn'));
  
  this.dashboardLink = element(by.id('dashboardLink'));
  this.catalogLink = element(by.id('catalogLink'));
  this.catalogAddLink = element(by.id('catalogAddLink'));
  
  this.apiLink = element(by.id('apiLink'));
  this.contactUsLink = element(by.id('contactUsLink'));
  
  this.helpLink = function(index) {  return element(by.id('helpLink' + index.toString())); };
};

LandingPage.prototype.get = function() {
  "use strict";

  browser.get(TEST_HOSTNAME + '/landing/');
  this.verify();
};

// Ensure that we are on the landing page
LandingPage.prototype.verify = function() {
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

LandingPage.prototype.clickLearnMore = function() {
  "use strict";

  return this.learnMoreBtn.click();
};

LandingPage.prototype.clickSignIn = function() {
  "use strict";

  return this.signInBtn.click();
};

LandingPage.prototype.clickSignUp = function() {
  "use strict";

  return this.signUpBtn.click();
};

LandingPage.prototype.clickDashboardLink = function() {
  "use strict";

  return this.dashboardLink.click();
};

LandingPage.prototype.clickCatalogLink = function() {
  "use strict";

  return this.catalogLink.click();
};

LandingPage.prototype.clickCatalogAddLink = function() {
  "use strict";

  return this.catalogAddLink.click();
};

LandingPage.prototype.clickApiLink = function(predicate) {
  "use strict";

  var context = this;
  return helpers.scrollToAndThen(0,10000, function () {
    context.apiLink.click();
  }).then(predicate);
};

LandingPage.prototype.clickContactUsLink = function(predicate) {
  "use strict";

  var context = this;
  return helpers.scrollToAndThen(0,10000, function () {
    context.contactUsLink.click();
  }).then(predicate);
};

LandingPage.prototype.clickHelpLink = function(index) {
  "use strict";

  return this.helpLink(index).click();
};

module.exports = LandingPage;
