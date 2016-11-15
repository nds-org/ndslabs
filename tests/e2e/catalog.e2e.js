/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var EC = protractor.ExpectedConditions;

var TEST_HELP_LINK_TARGET = /https\:\/\/nationaldataservice\.atlassian\.net\/wiki\/display\/NDSC\/.+/;

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {  
  var navbar = new Navbar();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var landingPage = new LandingPage();

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
  });
  
  describe('As Table', function() {
    beforeEach(function() {
      // Toggle to view as table
      catalogPage.toggleCardsBtn.click();
    });
    
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
  });
  
  describe('User Specs', function() {
    // TODO: Import
    // TODO: Create
    // TODO: Edit
    // TODO: Delete
    // TODO: Clone error (duplicate key)
    
    describe('With an existing application instances', function (){
      // TODO: Edit (error due to existing instance)
      // TODO: Delete (error due to existing instance)
    });
  });
});