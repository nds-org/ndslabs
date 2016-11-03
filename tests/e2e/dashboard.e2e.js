/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");
var dashboard = require('./pages/dashboard.page.js');

// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
    dashboard.startOnDashboardView(false);
  });
  
  beforeEach(function() { helpers.beforeEach(); 
    dashboard.startOnDashboardView(true);
  });
  
  afterEach(function() { helpers.afterEach(); });
  
  afterAll(function() { 
    helpers.afterAll();
    shared.signOut();
  });
  
  it('should offer catalog link if no applications present', function() {
    
  });
});