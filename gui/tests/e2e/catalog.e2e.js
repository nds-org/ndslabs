/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var catalog = require('./pages/catalog.page.js');

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    catalog.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
    shared.navbar.expandAccountDropdown();
    shared.navbar.clickSignOut();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should verify page', function() {
    
  });
});