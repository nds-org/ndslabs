/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditSpecPage = require('./pages/addEditSpec.page.js');

var EC = protractor.ExpectedConditions;

var TEST_HELP_LINK_TARGET = /https\:\/\/nationaldataservice\.atlassian\.net\/wiki\/display\/NDSC\/.+/;

var specKey = 'cloud9cpp';
var cloneKey = 'clonedspec';

var TIMEOUT_EXPECT_NEW_TAB = 30000;

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {  
  "use strict";

  var navbar = new Navbar();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var landingPage = new LandingPage();
  var addSpecPage = new AddEditSpecPage();
  var editSpecPage = new AddEditSpecPage();
  
  var generateTestSpecJson = function(specKey) {
    return '{"key":"' + specKey + '","label":"An imported spec","description":"An imported spec","logo":"https://nationaldataservice.atlassian.net/wiki/download/attachments/16613382/cloudcmd.png","image":{"registry":"","name":"coderaiser/cloudcmd","tags":["5.5.1-alpine","5.5.1","latest"]},"display":"stack","access":"external","args":["--root","/home/$(NAMESPACE)"],"ports":[{"port":8000,"protocol":"http"}],"readinessProbe":{"type":"http","path":"/favicon.ico","port":8000,"initialDelay":5,"timeout":45},"resourceLimits":{"cpuMax":200,"cpuDefault":100,"memMax":1000,"memDefault":50},"tags":["21","6"],"info":"https://nationaldataservice.atlassian.net/wiki/display/NDSC/Cloud+Commander","authRequired":true}';
  };
  
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
  
  it('should offer main services that we expect to see', function() {
    expectSpec('toolmanager');
    expectSpec('cloud9cpp');
    expectSpec('clowder');
    expectSpec('dataverse');
    
    // TODO: How to scroll to expected cards
  });
  
  it('should offer view as cards or table', function() {
    expect(catalogPage.toggleCardsBtn.isPresent()).toBe(true);
    expect(catalogPage.toggleCardsBtn.isDisplayed()).toBe(true);
    expect(catalogPage.toggleCardsBtn.isEnabled()).toBe(true);
    
    // FIXME: Verify that clicking actually toggles view
  });
  
  it('should allow the user to import a custom spec', function() {
    var importKey = 'importedspec';
    
    var specJson = generateTestSpecJson(importKey);
    catalogPage.importSpec(specJson);
    
    expectSpec(importKey);
    
    // Delete imported spec to reset test state
    catalogPage.deleteSpec(importKey);
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
      catalogPage.cloneSpec(specKey, cloneKey).then(function() {
        expectSpec(cloneKey);
        catalogPage.deleteSpec(cloneKey);
      });
    });
    
    it('should allow the user to view the JSON format of the spec', function() {
      catalogPage.viewJsonModal(specKey).then(function(match) {    
        browser.wait(EC.visibilityOf(catalogPage.exportSpecModal), 5000);
        catalogPage.cancelBtn.click();
        // TODO: How to verify clipboard contents?
      });
    });
    
    it('should offer the user a help link', function(done) {
      catalogPage.clickHelpLink(specKey).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET).then(function() {
          done();
        });
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should offer the user a link to view documentation', function(done) {
      catalogPage.clickViewDocumentation(specKey).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET).then(function() {
          done();
        });
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    describe('With Custom Spec', function() {
      beforeAll(function(done) {
        catalogPage.get(true);
        catalogPage.cloneSpec(specKey, cloneKey).then(function() {
          done();
        });
      }, 12000);
      
      afterAll(function(done) {
        catalogPage.get(true);
        catalogPage.deleteSpec(cloneKey).then(function() {
          done();
        });
      }, 12000);
      
      // TODO: Edit (error due to existing instance)
      // TODO: Delete (error due to existing instance)
      
      it('should allow the user to edit a custom spec', function(done) {
        catalogPage.editSpec(cloneKey).then(function() {
          editSpecPage.verify();
          done();
        });
      }, 12000);
      
      it('should allow the user to delete a custom spec', function(done) {
        catalogPage.deleteSpec(cloneKey);
        
        // Recreate the clone to reset test state
        catalogPage.cloneSpec(specKey, cloneKey);
        
        browser.waitForAngular();
        done();
      }, 12000);
    });
  });
  
  describe('As Table', function() {
    beforeEach(function() {
      // Toggle to view as table
      catalogPage.toggleCardsBtn.click();
    });
    
    // TODO: Clone error (duplicate key)
    it('should allow the user to clone a spec', function() {
      catalogPage.cloneSpec(specKey, cloneKey, true).then(function() {
        catalogPage.deleteSpec(cloneKey, true);
      });
    });
    
    it('should allow the user to view the JSON format of the spec', function() {
      catalogPage.viewJsonModal(specKey, true).then(function(match) {    
        browser.wait(EC.visibilityOf(catalogPage.exportSpecModal), 5000);
        catalogPage.cancelBtn.click();
        // TODO: How to verify clipboard contents?
      });
    });
    
    it('should offer the user a help link', function(done) {
      catalogPage.clickHelpLink(specKey, true).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET).then(function() {
          done();
        });
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should offer the user a link to view documentation', function(done) {
      catalogPage.clickViewDocumentation(specKey, true).then(function() {
        helpers.expectNewTabOpen(TEST_HELP_LINK_TARGET).then(function() {
          done();
        });
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    describe('With Custom Spec', function() {
      
      beforeAll(function(done) {
        catalogPage.get(true);
        
        // NOTE: This is done in the "Cards" view, since the page just reloaded
        catalogPage.cloneSpec(specKey, cloneKey).then(function() {
          done();
        });
      }, 12000);
      
      afterAll(function(done) {
        catalogPage.get(true);
        
        // NOTE: This is done in the "Cards" view, since the page just reloaded
        catalogPage.deleteSpec(cloneKey).then(function() {
          done();
        });
      }, 12000);
      
      // TODO: Edit (error due to existing instance)
      // TODO: Delete (error due to existing instance)
      
      it('should allow the user to edit a custom spec', function(done) {
        
        catalogPage.editSpec(cloneKey, true).then(function() {
          editSpecPage.verify();
          done();
        });
      }, 12000);
      
      it('should allow the user to delete a custom spec', function(done) {
        catalogPage.deleteSpec(cloneKey, true);
        
        // Recreate the clone to reset test state
        catalogPage.cloneSpec(specKey, cloneKey, true);
        
        browser.waitForAngular();
        done();
      }, 12000);
    });
  });
});
