/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LandingPage = require('./pages/landing.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var ConsolePage = require('./pages/console.page.js');

var EC = protractor.ExpectedConditions;

var WAIT_TIME_APPLICATION_STARTUP = 120000;
var WAIT_TIME_APPLICATION_SHUTDOWN = 120000;

var TEST_CONSOLE_CMD = 'ls -al /home/$NAMESPACE';

var TEST_SPEC_KEY = 'toolmanager';

// dashboard.e2e.js
describe('Labs Workbench Application Service Console View', function() {
  "use strict";

  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var consolePage = new ConsolePage();
  
  var serviceId;
  var stackId;
  
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
          stackId = text.split('-')[0];
          dashboardPage.launchApplication(application);
          done();
        });
      });
    });
  }, WAIT_TIME_APPLICATION_STARTUP);
  
  beforeEach(function() {
    helpers.beforeEach();
    consolePage.get(stackId, serviceId, true);
  });
  
  afterEach(function() { 
    helpers.afterEach();
    
    // Retrieve all open window handles
    browser.getAllWindowHandles().then(function(handles) {
      // Close current tab
      helpers.closeTab(handles[0]);
    });
  });
  
  afterAll(function(done) { 
    helpers.afterAll();
    
    // Shutdown and remove any existing applications
    dashboardPage.get(true);
    dashboardPage.shutdownAndRemoveAllApplications();
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    landingPage.verify();
    done();
  }, WAIT_TIME_APPLICATION_SHUTDOWN);
  
  // TODO: We should include a console test with any per-application test suites 
  // (i.e. automate a simple Clowder or Dataverse use-case)
  
  it('should ensure that user\'s home folder is mounted via console', function() {
    // Wait for console (WebSokcet) to connect
    browser.wait(EC.textToBePresentInElement(consolePage.console, '#'), 3000);
  
    // Send a test command to the console: "ls -al /home/$NAMESPACE"
    // NOTE: We can't call .sendKeys on a <div> element, 
    //   so we send the keys to the browser instead
    browser.actions().sendKeys(TEST_CONSOLE_CMD).perform();
    
    // Press ENTER
    browser.actions().sendKeys(protractor.Key.ENTER).perform();
    
    // Wait for expected results
    browser.wait(EC.textToBePresentInElement(consolePage.console, TEST_CONSOLE_CMD), 3000);
    browser.wait(EC.textToBePresentInElement(consolePage.console, 'AppData'), 3000);
  });
});