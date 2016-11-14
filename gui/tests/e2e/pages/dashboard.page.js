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
  
  // Repeaters
  this.applications = element.all(by.repeater("stack in configuredStacks | orderBy:['name','id'] track by stack.id"));
  this.services = function(app) {  return app.all(by.repeater("svc in stack.services track by svc.id")); };
  this.endpointLinks = function(svc) {  return svc.all(by.repeater('endpt in svc.endpoints track by endpt.port')); };
  
  // Modal (popup) windows
  this.viewConfigModal = element(by.id('viewConfigModal'));
  this.viewLogsModal = element(by.id('viewLogsModal'));
  this.stackDeleteModal = element(by.id('stackDeleteModal'));
  this.stackRenameModal = element(by.id('stackRenameModal'));
  this.stackStopModal = element(by.id('stackStopModal'));
  
  // Shared Modal Stuff
  this.confirmBtn = element(by.id('confirmBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
  this.closeBtn = element(by.id('closeBtn'));
  
  // Other Modal Stuff
  this.nameInput = element(by.id('nameInput'));       // Rename modal
  this.logBody = element(by.id('logBody'));           // View logs modal
  
  // Application Stuff
  this.applicationLabel = function(app) {  return app.element(by.id('applicationLabel')); };
  this.renameBtn = function(app) {  return app.element(by.id('renameBtn')); };
  this.toggleAuthBtn = function(app) {  return app.element(by.id('toggleAuthBtn')); };
  this.launchBtn = function(app) {  return app.element(by.id('launchBtn')); };
  this.deleteBtn = function(app) {  return app.element(by.id('deleteBtn')); };
  
  this.addServiceBtn = function(app) {  return app.element(by.id('addServiceBtn')); };
  
  this.shutdownBtn = function(app) {  return app.element(by.id('shutdownBtn')); };

  // Service Stuff
  this.serviceIdText = function(svc) {  return svc.element(by.id('serviceIdText')); };
  this.statusText = function(svc) {  return svc.element(by.id('statusText')); };
  this.editServiceBtn = function(svc) {  return svc.element(by.id('editServiceBtn')); };
  this.helpLink = function(svc) {  return svc.element(by.id('helpLink')); };
  
  this.removeServiceBtn = function(svc) {  return svc.element(by.id('removeBtn')); };
  
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

DashboardPage.prototype.launchApplication = function(application) {
  var launchBtn = this.launchBtn(application);
  //if (!launchBtn.isPresent()) {
    application.click();
  //}
  
  // Wait for the shutdown button to be clickable
  browser.wait(EC.elementToBeClickable(launchBtn), 120000);
  launchBtn.click();
  
  browser.wait(function() {
    return helpers.hasClass(application, 'panel-success');
  }, 120000);
  expect(helpers.hasClass(application, 'panel-success')).toBe(true); 
};

DashboardPage.prototype.shutdownApplication = function(application) {
  var shutdownBtn = this.shutdownBtn(application);
  //if (!shutdownBtn.isPresent()) {
    application.click();
  //}
  
  // Wait for the shutdown button to be clickable
  browser.wait(EC.elementToBeClickable(shutdownBtn), 120000);
  shutdownBtn.click();
  this.confirmBtn.click();
  
  // Wait for the application to shut down before returning
  browser.wait(function() {
    return helpers.hasClass(application, 'panel-danger');
  }, 120000);
  expect(helpers.hasClass(application, 'panel-danger')).toBe(true); 
};

DashboardPage.prototype.removeApplication = function(application) {
  var deleteBtn = this.deleteBtn(application);
  //if (!deleteBtn.isPresent()) {
    application.click();
  //}
  
  browser.wait(EC.elementToBeClickable(deleteBtn), 120000);
  deleteBtn.click();
  this.confirmBtn.click();
};

module.exports = DashboardPage;
