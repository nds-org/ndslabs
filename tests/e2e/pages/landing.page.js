/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {}

var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var PAGE_TITLE = 'Labs Workbench Landing Page';
var PAGE_ROUTE = shared.config.TEST_HOSTNAME + '/';

var LandingPage = function() {
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
  browser.get(PAGE_ROUTE);
  this.verify();
};

// Ensure that we are on the landing page
LandingPage.prototype.verify = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

LandingPage.prototype.clickLearnMore = function() {
  this.learnMoreBtn.click();
};

LandingPage.prototype.clickSignIn = function() {
  this.signInBtn.click();
};

LandingPage.prototype.clickSignUp = function() {
  this.signUpBtn.click();
};

LandingPage.prototype.clickDashboardLink = function() {
  this.dashboardLink.click();
};

LandingPage.prototype.clickCatalogLink = function() {
  this.catalogLink.click();
};

LandingPage.prototype.clickCatalogAddLink = function() {
  this.catalogAddLink.click();
};

LandingPage.prototype.clickApiLink = function(predicate) {
  var context = this;
  helpers.scrollToAndThen(0,10000, function () {
    context.apiLink.click();
  }).then(predicate);
};

LandingPage.prototype.clickContactUsLink = function(predicate) {
  var context = this;
  helpers.scrollToAndThen(0,10000, function () {
    context.contactUsLink.click();
  }).then(predicate);
};

LandingPage.prototype.clickHelpLink = function(index) {
  this.helpLink(index).click();
};

module.exports = LandingPage;