/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require('./helpers.e2e.js');
var shared = require('./pages/shared.page.js');

var login = require('./pages/login.page.js');
var landing = require('./pages/landing.page.js');
var dashboard = require('./pages/dashboard.page.js');
var signup = require('./pages/signup.page.js');

var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;
var TEST_INVALID_PASSWORD_MISMATCH = shared.config.TEST_INVALID_PASSWORD_MISMATCH;

// login.e2e.js
describe('Labs Workbench Login View', function() {
  beforeEach(function() { helpers.beforeEach(); });
  beforeAll(function() { helpers.beforeAll(); });
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  // Do not allow user past login view with invalid credentials
  it('should deny invalid login', function() {
    login.get();
    
    // Attempt to sign in with invalid credentials
    login.enterUsername(TEST_USERNAME);
    login.enterPassword(TEST_INVALID_PASSWORD_MISMATCH);
    login.clickLogin();
    
    // We should remain on the login view
    login.verify();
  });
  
  // Allow user past login view with valid credentials
  it('should accept valid login', function() {
    login.get();
    
    // Attempt to sign in with valid credentials
    login.enterUsername(TEST_USERNAME);
    login.enterPassword(TEST_PASSWORD);
    login.clickLogin();
    
    // We should be taken to the Dashboard View
    dashboard.verify();
  });
  
  // Allow user to logout
  it('should allow logout', function() {
    dashboard.get(true);
    
    // Sign out using the navbar
      shared.navbar.expandAccountDropdown();
      shared.navbar.clickSignOut();
    
    // We should be taken to the Landing Page View
    landing.verify();
  });
});