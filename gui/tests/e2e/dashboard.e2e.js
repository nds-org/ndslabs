/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require('./pages/landing.page.js');
var dashboard = require('./pages/dashboard.page.js');
var catalog = require('./pages/catalog.page.js');

// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
    dashboard.get();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    dashboard.get(true);
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
  
  // How to test up for test? Is it safe to just delete applications?
  it('should link to the catalog page if no applications are present', function() {
    dashboard.clickCatalogLink();
    catalog.verify();
  });
});