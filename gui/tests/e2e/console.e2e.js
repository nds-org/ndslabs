/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LandingPage = require('./pages/landing.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var WAIT_TIME_APPLICATION_STARTUP = 120000;
var WAIT_TIME_APPLICATION_SHUTDOWN = 120000;

var TEST_SPEC_KEY = 'toolmanager';

// dashboard.e2e.js
describe('Labs Workbench Reset Password View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  
  var serviceId;
  
  beforeAll(function() { 
    helpers.beforeAll();
    dashboardPage.get();
    dashboardPage.shutdownAndRemoveAllApplications();
    
    catalogPage.get();
    catalogPage.installApplication(TEST_SPEC_KEY);
  }, WAIT_TIME_APPLICATION_STARTUP);
  
  beforeEach(function() {
    helpers.beforeEach(); 
    console.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  }, WAIT_TIME_APPLICATION_SHUTDOWN);
  
  it('should verify page', function() {
    
  });
});