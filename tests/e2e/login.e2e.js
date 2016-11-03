/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require('./helpers.e2e.js');
var shared = require('./pages/shared.page.js');

var login = require('./pages/login.page.js');
var dashboard = require('./pages/dashboard.page.js');

// login.e2e.js
describe('Labs Workbench Login View', function() {
  beforeEach(function() { helpers.beforeEach(); });
  beforeAll(function() { helpers.beforeAll(); });
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  // Do not allow user past login view with invalid credentials
  it('should deny invalid login', function() {
    login.startOnLoginView();
    
    // Attempt to sign in with invalid credentials
    login.invalidSignIn();
    
    // We should remain on the login view
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/login');
  });
  
  // Allow user past login view with valid credentials
  it('should accept valid login', function() {
    login.startOnLoginView();
    
    // Attempt to sign in with valid credentials
    login.validSignIn();
    
    // We should be taken to the Dashboard View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/home');
  });
  
  // Allow user to logout
  it('should allow logout', function() {
    dashboard.startOnDashboardView(true);
    
    // We should be taken to the Dashboard View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/home');
    
    // Sign out using helper function
    shared.signOut();
    
    // We should be taken to the Landing Page View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/');
  });
});