/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var AddEditSpecPage = require('./pages/addEditSpec.page.js');

// addSpec.e2e.js
describe('Labs Workbench Add Application Spec View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var addSpecPage = new AddEditSpecPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
    dashboardPage.get();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    addSpecPage.get({ loggedIn: true });
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() {
    helpers.afterAll();
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    landingPage.verify();
  });
  
  var expectBtn = function(enabled) {
    var saveBtn = addSpecPage.saveBtn;
    helpers.scrollToAndThen(0, 10000, function() {
      expect(saveBtn.isDisplayed()).toBe(true);
      expect(saveBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
    });
  };
  
  it('should verify page', function() {
    addSpecPage.verify();
  });
});