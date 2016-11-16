/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditSpecPage = require('./pages/addEditSpec.page.js');

// addSpec.e2e.js
describe('Labs Workbench Edit Application Spec View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var editSpecPage = new AddEditSpecPage();
  
  var specKey = 'toolmanager';
  var cloneKey = 'clonedspec';
  
  // FIXME: Test browser should scroll to card (how?)
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
  
  beforeAll(function() { 
    helpers.beforeAll();
    catalogPage.get();
    
    catalogPage.cloneSpec(specKey, cloneKey);
    expectSpec(cloneKey);
  });
  
  beforeEach(function() {
    helpers.beforeEach();
    catalogPage.editSpec(cloneKey);
    //editSpecPage.get({ loggedIn: true, editId: cloneKey });
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();catalogPage.get(true);
    catalogPage.deleteSpec(cloneKey);
    
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    landingPage.verify();
  });
  
  var expectBtn = function(enabled) {
    var saveBtn = editSpecPage.saveBtn;
    helpers.scrollToAndThen(0, 10000, function() {
      expect(saveBtn.isDisplayed()).toBe(true);
      expect(saveBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
    });
  };
  
  it('should verify page', function() {
    editSpecPage.verify();
  });
});