/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var SwaggerUiPage = require('./pages/swagger.page.js');

var EXPECTED_API_TITLE = "NDS Labs Workbench";

// swagger.e2e.js
describe('Labs Workbench Swagger UI View', function() {
  "use strict";

  var swaggerUiPage = new SwaggerUiPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    swaggerUiPage.get();
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  it('should offer a Workbench API reference', function() {
    expect(swaggerUiPage.apiTitle.isPresent()).toBe(true);
    expect(swaggerUiPage.apiTitle.isDisplayed()).toBe(true);
    expect(swaggerUiPage.apiTitle.getText()).toBe(EXPECTED_API_TITLE);
  });
});
