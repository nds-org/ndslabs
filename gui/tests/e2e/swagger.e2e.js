/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var SwaggerUiPage = require('./pages/swagger.page.js');

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
  
  it('should offer a swagger-ui component', function() {
    expect(swaggerUiPage.swaggerUi.isPresent).toBe(true);
    expect(swaggerUiPage.swaggerUi.isDisplayed).toBe(true);
  });
});
