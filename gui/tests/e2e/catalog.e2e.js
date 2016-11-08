/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var _ = require('lodash');

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {  
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();

  beforeAll(function() { 
    console.log("Now Testing: Labs Workbench Catalog View");
    
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
    shared.navbar.expandAccountDropdown();
    shared.navbar.clickSignOut();
    landing.verify();
  });
  
  it('should verify page', function() {
    var target = 'clowder';
    helpers.selectByModel(catalogPage.cards, "spec.key", function(key) { 
      return key === target; // How to know we've found our match
    }, 
    function(card) {  // What to do with our match
      card.element(by.id('addBtn')).click();
    });
  });
});