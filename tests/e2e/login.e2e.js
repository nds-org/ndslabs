/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

var shared = require('./shared.e2e.js');

// login.e2e.js
describe('Labs Workbench Login View', function() {
  beforeEach(function() { shared.beforeEach(); });
  beforeAll(function() { shared.beforeAll(); });
  afterEach(function() { shared.afterEach(); });
  afterAll(function() { shared.afterAll(); });
  
  // Do not allow user past login view with invalid credentials
  it('should deny invalid login', function() {
    shared.startOnLoginView();
    
    // Attempt to sign in with vinalid credentials
    shared.signIn(shared.config.TEST_USERNAME, shared.config.TEST_INVALID_PASSWORD);
    
    // TODO: change this to id selector
    element(by.css('[ng-click="login()"]')).click();
    
    // We should remain on the login view
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/login');
  });
  
  // Allow user past login view with valid credentials
  it('should accept valid login', function() {
    shared.startOnLoginView();
    
    // Attempt to sign in with valid credentials
    shared.signIn();
    
    // We should be taken to the Dashboard View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/home');
  });
  
  // Allow user to logout
  it('should allow logout', function() {
    shared.startOnDashboardView();
    
    // We should be taken to the Dashboard View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/home');
    
    // Sign out using helper function
    shared.signOut();
    
    // We should be taken to the Landing Page View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/');
  });
});