/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {}

var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');
var landing = require('./landing.page.js');
var login = require('./login.page.js');

var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;

var PAGE_TITLE = 'Labs Workbench Dashboard';
var PAGE_ROUTE = shared.config.TEST_HOSTNAME + '/home';

var EC = protractor.ExpectedConditions;

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
  this.renameBtn = function(app) {  return app.element(by.id('renameBtn')); };
  this.toggleAuthBtn = function(app) {  return app.element(by.id('toggleAuthBtn')); };
  this.launchBtn = function(app) {  return app.element(by.id('launchBtn')); };
  this.deleteBtn = function(app) {  return app.element(by.id('deleteBtn')); };
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

DashboardPage.prototype.removeApp = function(applicationId) {
  var predicate = function(application) {  // What to do with our match
    helpers.scrollIntoViewAndClick(application);
    browser.wait(EC.elementToBeClickable(application), 5000);
    application.click();
    
    var deleteBtn = application.element(by.id('deleteBtn'));
    browser.wait(EC.elementToBeClickable(deleteBtn), 5000);
    helpers.scrollIntoViewAndClick(deleteBtn);
    
    var confirmBtn = element(by.id('confirmBtn'));
    browser.wait(EC.elementToBeClickable(confirmBtn), 5000);
    helpers.scrollIntoViewAndClick(confirmBtn);
    
    browser.wait(3000);
  };
  
  if (!applicationId && this.applications.count() > 1) {
    predicate(this.applications.get(0));
  } else {
    return helpers.selectByModel(this.applications, "stack.id", function(application) { 
      return application.id === applicationId; // How to know we've found our match
    }, predicate);
  }
};

module.exports = DashboardPage;
