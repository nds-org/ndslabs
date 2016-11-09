/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var ResetPasswordPage = require('./pages/reset.page.js');

// dashboard.e2e.js
describe('Labs Workbench Reset Password View', function() {
  var resetPasswordPage = new ResetPasswordPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    resetPasswordPage.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should verify page', function() {
    
  });
  
  describe('After Sign In', function() {
    
  });
});