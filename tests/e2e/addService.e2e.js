/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require('./helpers.e2e.js');

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LandingPage = require('./pages/landing.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var ConsolePage = require('./pages/catalog.page.js');
var AddEditServicePage = require('./pages/addEditService.page.js');

var TEST_SPEC_KEY = 'clowder';
var TEST_SERVICE_INDEX_TO_ADD = 0;

var EC = protractor.ExpectedConditions;

// dashboard.e2e.js
describe('Labs Workbench Add Optional Application Service View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var consolePage = new ConsolePage();
  var addServicePage = new AddEditServicePage();

  var stackId;
  var serviceId;
  
  var serviceKey;
  
  // FIXME: Test browser should scroll to card
  // FIXME: Move this to helpers
  var expectService = function(stackId, serviceKey) {
    // Wait for new service to appear
    return browser.wait(function() {
      return helpers.selectByModel(dashboardPage.services(element), "svc.id", function(id) { 
        // NOTE: This *should* always be 7, but will never be -1
        return id === (stackId + '-' + serviceKey); // How to know we've found our match
      }, function(service) { 
        return service;
      });
    }, 5000);
  };
  
  // FIXME: Move this to helpers
  var expectBtn = function(enabled) {
    var saveBtn = addServicePage.saveBtn;
    helpers.scrollIntoView(saveBtn);
    expect(saveBtn.isDisplayed()).toBe(true);
    expect(saveBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
  };
  
  beforeAll(function() { 
    helpers.beforeAll();
    
    // Login and shutdown / remove any existing applications
    dashboardPage.get();
    dashboardPage.shutdownAndRemoveAllApplications();
    
    // Install and start a test application
    catalogPage.get(true);
    catalogPage.installApplication(TEST_SPEC_KEY).then(function() {
      // Click over to the dashboard
      catalogPage.viewApplicationOnDashboard(TEST_SPEC_KEY);
      
      // Save the application's ID
      dashboardPage.verify();
      dashboardPage.applications.then(function(applications) {
        var application = applications[0];
        dashboardPage.services(application).then(function(services) {
          var service = services[0];
          dashboardPage.serviceIdText(service).getText().then(function(text) {
            serviceId = text;
            stackId = text.split('-')[0];
          });
        });
      });
    });
  });
  
  beforeEach(function() {
    helpers.beforeEach();
    addServicePage.get(stackId, TEST_SERVICE_INDEX_TO_ADD, true);
    
    // Retrieve added service key from the URL
    browser.getCurrentUrl().then(function(url) {
      var fragments = url.split('/');
      return serviceKey = fragments[fragments.length - 1];
    });
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
    landingPage.verify();
    done();
  });
  
  it('should allow the user to abort the creation process', function() {
    // Click the cancel button
    var cancelBtn = addServicePage.cancelBtn;
    helpers.scrollIntoView(cancelBtn);
    cancelBtn.click();
    
    // Ensure that we are brought back to the dashboard page
    dashboardPage.verify();
  });
  
  it('should allow the user to save after entering all required fields', function() {
    //console.log("Adding service " + serviceKey + " to "+ stackId);
    
    // Click the save button
    var saveBtn = addServicePage.saveBtn;
    expectBtn(true);
    helpers.scrollIntoView(saveBtn);
    saveBtn.click();
    
    // Ensure that we are brought back to the catalog page
    dashboardPage.verify();
    
    // Verify that our new spec was added
    expectService(stackId, serviceKey).then(function(service) {
      // Remove this service to reset the test state
      var removeServiceBtn = dashboardPage.removeServiceBtn(service);
      removeServiceBtn.click();
    });
  });
});