/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var Navbar = require('./navbar.page.js');
var LandingPage = require('./landing.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "service name" in title?
// TODO: How to handle "stackServiceId" in url?
var PAGE_TITLE = 'Labs Workbench'; //'Swagger UI';
var PAGE_ROUTE = /https?\:\/\/.+\/landing\/\#?\/?swagger/;;

var SwaggerUiPage = function() {
  "use strict";

  /**
   * Insert public Getters here for page elements
   */
  this.swaggerUi = element(by.css('.swagger-ui'));
  this.apiTitle = element(by.binding('ui.infos.title'));
};

// Naviagte to Swagger UI view
SwaggerUiPage.prototype.get = function() {
  "use strict";

  browser.get(TEST_HOSTNAME + '/landing/swagger/');
  /*var landingPage = new LandingPage();
  var navbar = new Navbar();
  landingPage.get();
  
  navbar.expandHelpDropdown();
  navbar.clickApiReferenceNav();*/
	
  this.verify();
};

// Ensure that we are on the correct page
SwaggerUiPage.prototype.verify = function() { 
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

/**
 * Insert public functions here for user interactions
 */

module.exports = SwaggerUiPage;
