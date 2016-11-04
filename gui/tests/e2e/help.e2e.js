/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var help = require('./pages/help.page.js');

// help.e2e.js
describe('Labs Workbench Contact Us View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    help.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should verify page', function() {
    
  });
});