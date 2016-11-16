/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditSpecPage = require('./pages/addEditSpec.page.js');

var TEST_CREATED_SPEC_KEY = 'createdspec';
var TEST_CREATED_SPEC_NAME = 'New Application';
var TEST_CREATED_SPEC_IMAGE_NAME = 'ndslabs/cowsay-php';

var EC = protractor.ExpectedConditions;

// addSpec.e2e.js
describe('Labs Workbench Add Application Spec View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
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
  
  // FIXME: Test browser should scroll to card
  // FIXME: Move this to helpers
  var expectSpec = function(specKey, viewAsTable) {
    // Wait for new card to appear
    return browser.wait(function() {
      return helpers.selectByModel(viewAsTable ? catalogPage.table : catalogPage.cards, "spec.key", function(key) { 
        return key === specKey; // How to know we've found our match
      }, function(match) { 
        return match;
      });
    }, 5000);
  };
  
  // FIXME: Move this to helpers
  var expectBtn = function(enabled) {
    var saveBtn = addSpecPage.saveBtn;
    helpers.scrollIntoView(saveBtn);
    expect(saveBtn.isDisplayed()).toBe(true);
    expect(saveBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
  };
  
  it('should allow the user to abort the creation process', function() {
    // Click the cancel button
    var cancelBtn = addSpecPage.cancelBtn;
    helpers.scrollIntoView(cancelBtn);
    cancelBtn.click();
    
    // Ensure that we are brought back to the catalog page
    catalogPage.verify();
  });
  
  it('should allow the user to save after entering all required fields', function() {
    // Enter all required fields: key, name, image name
    addSpecPage.keyField.sendKeys(TEST_CREATED_SPEC_KEY);
    addSpecPage.nameField.sendKeys(TEST_CREATED_SPEC_NAME);
    addSpecPage.imageNameField.sendKeys(TEST_CREATED_SPEC_IMAGE_NAME);
    
    // Click the save button
    var saveBtn = addSpecPage.saveBtn;
    helpers.scrollIntoView(saveBtn);
    browser.wait(EC.elementToBeClickable(saveBtn), 120000);
    expectBtn(true);
    saveBtn.click();
    
    // Ensure that we are brought back to the catalog page
    catalogPage.verify();
    
    // Verify that our new spec was added
    expectSpec(TEST_CREATED_SPEC_KEY).then(function(application) {
      helpers.scrollIntoView(application);
    
      // Delete the new spec to reset test state
      catalogPage.deleteSpec(TEST_CREATED_SPEC_KEY);
    });
  });
});