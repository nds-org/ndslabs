/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LandingPage = require('./pages/landing.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var ConsolePage = require('./pages/catalog.page.js');

var WAIT_TIME_APPLICATION_STARTUP = 120000;
var WAIT_TIME_APPLICATION_SHUTDOWN = 120000;

var TEST_SPEC_KEY = 'clowder';

// dashboard.e2e.js
describe('Labs Workbench Add Optional Application Service View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var consolePage = new ConsolePage();
  
  var serviceId;
  
  beforeAll(function(done) { 
    helpers.beforeAll();
    
    // Login and shutdown / remove any existing applications
    dashboardPage.get();
    dashboardPage.shutdownAndRemoveAllApplications();
    
    // Install and start a test application
    catalogPage.get(true);
    catalogPage.installApplication(TEST_SPEC_KEY).then(function() {
      // Click over to the dashboard
      catalogPage.viewApplicationOnDashboard(TEST_SPEC_KEY);
      
      // Save the application's ID and launch it
      dashboardPage.verify();
      dashboardPage.applications.each(function(application) {
        dashboardPage.serviceIdText(application).getText().then(function(text) {
          serviceId = text;
          dashboardPage.launchApplication(application);
          done();
        });
      });
    });
  }, WAIT_TIME_APPLICATION_STARTUP);
  
  beforeEach(function() {
    helpers.beforeEach(); 
    consolePage.get(true);
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function(done) { 
    helpers.afterAll();
    
    // Shutdown and remove any existing applications
    dashboardPage.get(true);
    dashboardPage.shutdownAndRemoveAllApplications();
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    done();
  }, WAIT_TIME_APPLICATION_SHUTDOWN);
  
  it('should verify page', function() {
    console.log("Add service to "+ serviceId);
  });
});