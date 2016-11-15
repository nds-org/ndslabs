/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var ResetPasswordPage = require('./pages/reset.page.js');

// dashboard.e2e.js
describe('Labs Workbench Reset Password View', function() {
  var navbar = new Navbar();
  var dashboardPage = new DashboardPage();
  var resetPasswordPage = new ResetPasswordPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    resetPasswordPage.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should verify page', function() {
    
  });
  
  describe('After Sign In', function() {
    beforeAll(function() { 
      dashboardPage.get();
      resetPasswordPage.get(true);
    });
    
    afterAll(function() {
    // Log out to reset test state
      navbar.expandAccountDropdown();
      navbar.clickSignOut();
      landingPage.verify();
    });
  });
});