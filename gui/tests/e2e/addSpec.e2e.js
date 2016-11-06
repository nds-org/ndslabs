/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require('./pages/landing.page.js');
var dashboard = require('./pages/dashboard.page.js');
var addSpec = require('./pages/addEditSpec.page.js');

// addSpec.e2e.js
describe('Labs Workbench Add Spec View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
    dashboard.get();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    addSpec.get(true);
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
    shared.navbar.expandAccountDropdown();
    shared.navbar.clickSignOut();
  });
  
  it('should verify page', function() {
    
  });
});