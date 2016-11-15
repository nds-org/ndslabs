/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {  
  var navbar = new Navbar();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var landingPage = new LandingPage();

  beforeAll(function() { 
    helpers.beforeAll();
    dashboardPage.get();
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
  
  it('should verify page', function() {
    catalogPage.verify();
  });
  
  it('should allow the user to filter using a search query', function() {
    catalogPage.applyFilter('clowder');
    expect(catalogPage.cards.count()).toBe(2);
    
    // TODO: Expect Clowder + pyCharm for Clowder
  });
  
  it('should allow the user to filter using tags', function() {
    catalogPage.applyTag('Archive');
    expect(catalogPage.cards.count()).toBe(1);
    
    // TODO: Expect Dataverse
  });
  
  describe('As Cards', function() {
    beforeAll(function() {
      catalogPage.toggleCardsView(true);
    });
    
    beforeEach(function() {
      expect(helpers.hasClass(catalogPage.viewAsIcon, 'fa-list')).toBe(true);
      expect(helpers.hasClass(catalogPage.viewAsIcon, 'fa-table')).toBe(false);
    });
    
    it('should allow the user to install an application', function() {
      catalogPage.installApplication('toolmanager');
      dashboardPage.shutdownAndRemoveAllApplications();
    });
    
    it('should allow the user to view the JSON format of the spec', function() {
      
      // TODO: Expect Dataverse
    });
    
    // TODO: View JSON
    // TODO: Clone
    // TODO: Export
    // TODO: Help Link(s)
  });
  
  describe('As Table', function() {
    beforeAll(function() {
      catalogPage.toggleCardsView(false);
    });
    
    beforeEach(function() {
      expect(helpers.hasClass(catalogPage.viewAsIcon, 'fa-table')).toBe(true);
      expect(helpers.hasClass(catalogPage.viewAsIcon, 'fa-list')).toBe(false);
    });
    
    it('should allow the user to view the JSON format of the spec', function() {
      
      // TODO: Expect Dataverse
    });
    
    // TODO: View JSON
    // TODO: Clone
    // TODO: Export
    // TODO: Help Link(s)
  });
  
  describe('User Specs', function() {
    // TODO: Import
    // TODO: Create
    // TODO: Edit
    // TODO: Delete
    
    describe('With an existing application instances', function (){
      // TODO: Edit (error due to existing instance)
      // TODO: Delete (error due to existing instance)
    });
  });
});