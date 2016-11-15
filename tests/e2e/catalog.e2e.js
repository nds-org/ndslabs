/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditSpecPage = require('./pages/addEditSpec.page.js');

var EC = protractor.ExpectedConditions;

var TEST_HELP_LINK_TARGET = /https\:\/\/nationaldataservice\.atlassian\.net\/wiki\/display\/NDSC\/.+/;

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {  
  var navbar = new Navbar();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var landingPage = new LandingPage();
  var addSpecPage = new AddEditSpecPage();
  var editSpecPage = new AddEditSpecPage();

  beforeAll(function() { 
    helpers.beforeAll();
    dashboardPage.get();
    dashboardPage.shutdownAndRemoveAllApplications();
  });
  
  beforeEach(function() {
    helpers.beforeEach();
    catalogPage.get(true);
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
  
  it('should offer view as cards or table', function() {
    expect(catalogPage.toggleCardsBtn.isPresent()).toBe(true);
    expect(catalogPage.toggleCardsBtn.isDisplayed()).toBe(true);
    expect(catalogPage.toggleCardsBtn.isEnabled()).toBe(true);
    
    // FIXME: Verify that cicking actually toggles view
  });
  
  it('should allow the user to import a custom spec', function() {
    var specKey = 'testing';
    var specJson = '{ "key": "' + specKey + '" }';
    catalogPage.importSpec(specJson);
    
    helpers.sleep(3000);
    
    // Verify imported spec exists
    helpers.selectByModel(catalogPage.cards, "spec.key", function(key) { 
      return key === specKey; // How to know we've found our match
    }, 
    function(match) {  // What to do with our match
      expect(match.isPresent()).toBe(true);
      expect(match.isDisplayed()).toBe(true);
    });
  });
  
  it('should allow the user to create a custom spec', function() {
    catalogPage.createBtn.click();
    addSpecPage.verify();
  });
  
  // FIXME: Directive error?
  /*it('should allow the user to filter using a search query', function() {
    //catalogPage.applyFilter('clowder');
    //expect(catalogPage.cards.count()).toBe(2);
    
    // TODO: Expect Clowder + pyCharm for Clowder
  });
  
  // FIXME: Directive error?
  it('should allow the user to filter using tags', function() {
    //catalogPage.applyTag('Archive');
    //expect(catalogPage.cards.count()).toBe(1);
    
    // TODO: Expect Dataverse
  });*/
  
  describe('As Cards', function() {
    it('should allow the user to install an application', function() {
      catalogPage.installApplication('toolmanager').then(function() {
        dashboardPage.get(true);
        dashboardPage.shutdownAndRemoveAllApplications();
      });
    });
    
    // TODO: Clone error (duplicate key)
    it('should allow the user to clone a spec', function() {
      var specKey = 'toolmanager';
      var cloneKey = 'clonedspec';
      
      catalogPage.cloneSpec(specKey, cloneKey).then(function() {
        catalogPage.deleteSpec(cloneKey);
      });
    });
    
    it('should allow the user to view the JSON format of the spec', function() {
      var specKey = 'toolmanager';
      catalogPage.viewJsonModal(specKey).then(function(match) {    
        browser.wait(EC.visibilityOf(catalogPage.exportSpecModal), 5000);
        catalogPage.cancelBtn.click();
        // TODO: How to verify clipboard contents?
      });
    });
    
    it('should offer the user a help link', function() {
      var specKey = 'toolmanager';
      catalogPage.clickHelpLink(specKey).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET);
      });
    });
    
    it('should offer the user a link to view documentation', function() {
      var specKey = 'toolmanager';
      catalogPage.clickViewDocumentation(specKey).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET);
      });
    });
    
    describe('With Custom Spec', function() {
      var specKey = 'toolmanager';
      var cloneKey = 'clonedspec';
      
      beforeAll(function(done) {
        catalogPage.get(true);
        catalogPage.cloneSpec(specKey, cloneKey).then(function() {
          done();
        });
      }, 5000);
      
      afterAll(function(done) {
        catalogPage.get(true);
        catalogPage.deleteSpec(cloneKey).then(function() {
          done();
        });
      }, 5000);
      
      // TODO: Edit (error due to existing instance)
      // TODO: Delete (error due to existing instance)
      
      it('should allow the user to edit a custom spec', function() {
        
        catalogPage.editSpec(cloneKey, true).then(function() {
          editSpecPage.verify();
          
          // Delete clone to reset test state
          catalogPage.get(true);
        });
      });
      
      it('should allow the user to delete a custom spec', function() {
        catalogPage.deleteSpec(cloneKey);
        
        // Recreate the clone to reset test state
        catalogPage.cloneSpec(specKey, cloneKey, true);
      });
    });
  });
  
  describe('As Table', function() {
    beforeEach(function() {
      // Toggle to view as table
      catalogPage.toggleCardsBtn.click();
    });
    
    // TODO: Clone error (duplicate key)
    it('should allow the user to clone a spec', function() {
      var specKey = 'toolmanager';
      var cloneKey = 'clonedspec';
      
      catalogPage.cloneSpec(specKey, cloneKey, true).then(function() {
        catalogPage.deleteSpec(cloneKey, true);
      });
    });
    
    it('should allow the user to view the JSON format of the spec', function() {
      var specKey = 'toolmanager';
      catalogPage.viewJsonModal(specKey, true).then(function(match) {    
        browser.wait(EC.visibilityOf(catalogPage.exportSpecModal), 5000);
        catalogPage.cancelBtn.click();
        // TODO: How to verify clipboard contents?
      });
    });
    
    it('should offer the user a help link', function() {
      var specKey = 'toolmanager';
      catalogPage.clickHelpLink(specKey, true).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET);
      });
    });
    
    it('should offer the user a link to view documentation', function() {
      var specKey = 'toolmanager';
      catalogPage.clickViewDocumentation(specKey, true).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET);
      });
    });
    
    describe('With Custom Spec', function() {
      var specKey = 'toolmanager';
      var cloneKey = 'clonedspec';
      
      beforeAll(function(done) {
        catalogPage.get(true);
        catalogPage.cloneSpec(specKey, cloneKey, true).then(function() {
          done();
        });
      }, 12000);
      
      afterAll(function(done) {
        catalogPage.get(true);
        catalogPage.deleteSpec(cloneKey, true).then(function() {
          done();
        });
      }, 12000);
      
      // TODO: Edit (error due to existing instance)
      // TODO: Delete (error due to existing instance)
      
      it('should allow the user to edit a custom spec', function() {
        catalogPage.editSpec(cloneKey, true).then(function() {
          editSpecPage.verify();
        });
      });
      
      it('should allow the user to delete a custom spec', function() {
        catalogPage.deleteSpec(cloneKey);
        
        // Recreate the clone to reset test state
        catalogPage.cloneSpec(specKey, cloneKey, true);
      });
    });
  });
});