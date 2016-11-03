/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {}

var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var dashboard = require('./dashboard.page.js');
var login = require('./login.page.js');

var PAGE_TITLE = 'Labs Workbench Landing Page';
var PAGE_ROUTE = shared.config.TEST_HOSTNAME + '/';

var learnMoreBtn = function() {  return element(by.id('learnMoreBtn')); };

var signInBtn = function() { return element(by.id('signInBtn')); };
var signUpBtn = function() {  return element(by.id('signUpBtn')); };

var dashboardLink = function() {  return element(by.id('dashboardLink')); };

var apiLink = function() {  return element(by.id('apiLink')); };
var contactUsLink = function() {  return element(by.id('contactUsLink')); };

var helpLink = function(index) {  return element(by.id('helpLink' + index.toString())); };

// Ensure that we are on the landing page
module.exports.verifyLandingView = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

module.exports.startOnLandingView = function() {
  browser.get(PAGE_ROUTE);
  module.exports.verifyLandingView();
};

module.exports.gotoSignIn = function() {
  signInBtn().click();
  login.verifyLoginView();
};

module.exports.gotoSignUp = function() {
  signUpBtn().click();
};

module.exports.gotoDashboard = function() {
  dashboardLink().click();
  dashboard.verifyDashboardView();
};

module.exports.gotoApiReference = function(predicate) {
  helpers.scrollToAndThen(0,10000, function () {
    apiLink().click();
  }).then(predicate);
};

module.exports.gotoContactUs = function(predicate) {
  helpers.scrollToAndThen(0,10000, function () {
    contactUsLink().click();
  }).then(predicate);
};

module.exports.clickLearnMore = function() {
  learnMoreBtn().click();
};

module.exports.clickHelpLink = function(index) {
  helpLink(index).click();
};