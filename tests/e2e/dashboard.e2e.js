/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

var shared = require("./shared.e2e.js");

// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  beforeAll(function() { 
    shared.beforeAll();
    
    // Sign in to access Dashboard View
    shared.startOnLoginView();
    shared.signIn();
  });
  
  beforeEach(function() { shared.beforeEach(); 
    shared.startOnDashboardView();
  });
  
  afterEach(function() { shared.afterEach(); });
  
  afterAll(function() { 
    shared.afterAll();
    shared.signOut();
  });
  
  it('should offer catalog link if no applications present', function() {
    
  });
});