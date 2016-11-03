/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {}

var shared = require('./shared.page.js');

var PAGE_TITLE = 'Labs Workbench Landing Page';
var PAGE_ROUTE = shared.config.TEST_HOSTNAME + '/';

var signInBtn = function() { return element(by.id('signInBtn')); };
var signUpBtn = function() {  return element(by.id('signUpBtn')); };
var dashboardLink = function() {  return element(by.id('dashboardLink')); };

// Ensure that we are on the landing page
module.exports.verifyLandingView = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

module.exports.startOnLandingView = function() {
  browser.get(PAGE_ROUTE);
};

module.exports.gotoSignIn = function() {
  signInBtn().click();
};

module.exports.gotoSignUp = function() {
  signUpBtn().click();
};

module.exports.gotoDashboard = function() {
  dashboardLink().click();
};