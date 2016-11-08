/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {}

var shared = require('./shared.page.js');
var landing = require('./landing.page.js');
var login = require('./login.page.js');

var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;

var PAGE_TITLE = 'Labs Workbench Dashboard';
var PAGE_ROUTE = shared.config.TEST_HOSTNAME + '/home';

var LINK_CATALOG_ID = 'catalogLink';
var HELPERTEXT_DASHBOARD_ID = 'dashHelperText';

var helperText = function() {  return element(by.id(HELPERTEXT_DASHBOARD_ID)); };
var catalogLink = function() {  return element(by.id(LINK_CATALOG_ID)); };

// Application Stuff
var applicationHeading = function(appIndex) {  return element(by.id('application' + appIndex + 'AccordionHeading')); };

//var applications = element(by.repeater());

var renameBtn = function(appIndex) {  return element(by.id('application' + appIndex + 'RenameBtn')); };
var toggleAuthBtn = function(appIndex) {  return element(by.id('application' + appIndex + 'ToggleAuthBtn')); };
var launchBtn = function(appIndex) {  return element(by.id('application' + appIndex + 'LaunchBtn')); };
var removeBtn = function(appIndex) {  return element(by.id('application' + appIndex + 'DeleteBtn')); };

// Service Stuff
var statusText = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'StatusText')); };
var editServiceBtn = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'EditServiceBtn')); };
var helpLink = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'HelpLink')); };
var removeServiceBtn = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'RemoveBtn')); };

// Started Service Stuff
var endpointLink = function(appIndex, svcIndex, epIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'Ep' + epIndex + 'Link')); };
var consoleBtn = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'ConsoleBtn')); };
var viewLogsBtn = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'ViewLogsBtn')); };
var viewConfigBtn = function(appIndex, svcIndex) {  return element(by.id('application' + appIndex + 'Service' + svcIndex + 'ViewConfigBtn')); };

// Started Application Stuff
var addServiceBtn = function(appIndex) {  return element(by.id('application' + appIndex + 'AddServiceBtn')); };
var shutdownBtn = function(appIndex) {  return element(by.id('application' + appIndex + 'ShutdownBtn')); };

// Ensure we are on the dashboard page
module.exports.verify = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the dashboard view
module.exports.get = function(loggedIn) {
  if (loggedIn) {
    landing.get();
    shared.navbar.clickApplicationsNav();
  } else {
    login.get();
    login.enterUsername(TEST_USERNAME);
    login.enterPassword(TEST_PASSWORD);
    login.clickLogin();
  }
  
  module.exports.verify();
};

module.exports.isHelperTextPresent = function() {
  return helperText() && helperText().isPresent();
};

module.exports.clickCatalogLink = function() {
  catalogLink().click();
};

