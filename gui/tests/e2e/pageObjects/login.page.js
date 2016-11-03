/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');
var landing = require('./landing.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;
var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;

var INPUT_USERNAME_ID = 'inputNamespace';
var INPUT_PASSWORD_ID = 'inputPassword';

var PAGE_TITLE = 'Sign In to Labs Workbench'
var PAGE_ROUTE = TEST_HOSTNAME + '/login';

// TODO: change this to id selector
var loginBtn = function() {  return element(by.css('[ng-click="login()"]')); };
var usernameInput = function() { return helpers.getInput(by.id(INPUT_USERNAME_ID)); };
var passwordInput = function() {  return helpers.getInput(by.id(INPUT_PASSWORD_ID)); };

module.exports.startOnLoginView = function() {
  landing.startOnLandingView();
  landing.gotoSignIn();
  
  // Ensure that we are on the login page
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};
  
module.exports.signIn = function(username, password) {
  usernameInput().sendKeys(username || TEST_USERNAME);
  passwordInput().sendKeys(password || TEST_PASSWORD);
  loginBtn().click();
};