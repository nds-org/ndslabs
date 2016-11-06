/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var swagger = require('./pages/swagger.page.js');

// swagger.e2e.js
describe('Labs Workbench Swagger UI View', function() {
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    swagger.get();
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