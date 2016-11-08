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

var DashboardPage = function() {
  this.helperText = element(by.id('dashHelperText'));
  this.catalogLink = element(by.id('catalogLink'));
  
  this.applications = element.all(by.repeater("stack in configuredStacks | orderBy:['name','id'] track by stack.id"));
  this.services = function(app) {  return app.element.all(by.repeater("svc in stack.services track by svc.id")); };
  
  // Modal Stuff
  this.confirmBtn = element(by.id('confirmBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
  this.closeBtn = element(by.id('closeBtn'));

  // Application Stuff
  this.applicationHeading = function(app) {  return app ? app.element(by.id('accordionHeading')) : element(by.id('accordionHeading')); };
  this.renameBtn = function(app) {  return app.element(by.id('renameBtn')); };
  this.toggleAuthBtn = function(app) {  return app.element(by.id('toggleAuthBtn')); };
  this.launchBtn = function(app) {  return app.element(by.id('launchBtn')); };
  this.deleteBtn = function(app) {  return !app ? element(by.id('deleteBtn')) : app.element(by.id('deleteBtn')); };
  this.addServiceBtn = function(app) {  return app.element(by.id('addServiceBtn')); };
  this.shutdownBtn = function(app) {  return app.element(by.id('shutdownBtn')); };

  // Service Stuff
  this.statusText = function(svc) {  return svc.element(by.id('statusText')); };
  this.editServiceBtn = function(svc) {  return svc.element(by.id('editServiceBtn')); };
  this.helpLink = function(svc) {  return svc.element(by.id('helpLink')); };
  this.removeServiceBtn = function(svc) {  return svc.element(by.id('removeBtn')); };
  this.endpointLink = function(svc) {  return svc.element(by.id('endpointLink')); };
  this.consoleBtn = function(svc) {  return svc.element(by.id('consoleBtn')); };
  this.viewLogsBtn = function(svc) {  return svc.element(by.id('viewLogsBtn')); };
  this.viewConfigBtn = function(svc) {  return svc.element(by.id('viewConfigBtn')); };
};

// Ensure we are on the dashboard page
DashboardPage.prototype.verify = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the dashboard view
DashboardPage.prototype.get = function(loggedIn) {
  if (loggedIn) {
    landing.get();
    shared.navbar.clickApplicationsNav();
  } else {
    login.get();
    login.enterUsername(TEST_USERNAME);
    login.enterPassword(TEST_PASSWORD);
    login.clickLogin();
  }
  
  this.verify();
};

module.exports = DashboardPage;
