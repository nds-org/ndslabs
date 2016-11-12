/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var LandingPage = require('./landing.page.js');
var LoginPage = require('./login.page.js');
var Navbar = require('./navbar.page.js');

var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;

var PAGE_TITLE = 'Labs Workbench Dashboard';
var PAGE_ROUTE = /https\:\/\/.+\/\#\/home/

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

// Navigate to the Dashboard view
DashboardPage.prototype.get = function(loggedIn) {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var loginPage = new LoginPage();
  
  if (loggedIn) {
    landingPage.get();
    navbar.clickApplicationsNav();
  } else {
    loginPage.get();
    loginPage.enterUsername(TEST_USERNAME);
    loginPage.enterPassword(TEST_PASSWORD);
    loginPage.clickLogin();
  }
  
  this.verify();
};

// Ensure we are on the dashboard page
DashboardPage.prototype.verify = function() {
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

DashboardPage.prototype.shutdownApplication = function(application) {
  //if (!shutdownBtn.isPresent()) {
    application.click();
  //}
  
  var shutdownBtn = this.shutdownBtn(application);
  if (shutdownBtn.isPresent()) {
    shutdownBtn.click();
    this.confirmBtn.click();
  } else {
    console.log("ERROR: Shutdown button cannot be clicked: not present");
  }
};

DashboardPage.prototype.removeApplication = function(application) {
  //if (!deleteBtn.isPresent()) {
    application.click();
  //}
  
  var deleteBtn = this.deleteBtn(application);
  if (deleteBtn.isPresent()) {
    deleteBtn.click();
    this.confirmBtn.click();
  } else {
    console.log("ERROR: Delete button cannot be clicked: not present");
  }
  /*return helpers.selectByModel(this.applications, "stack.id", function(application) { 
    return application.id === application; // How to know we've found our match
  }, predicate);*/
  
};

module.exports = DashboardPage;
