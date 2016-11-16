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
  
  this.addServiceDropdown = function(app) {  return app.element(by.id('addServiceDropdown')); };
  this.addServiceDropdownOptions = function(app) {  return app.all(by.repeater('option in stack.key | options | notPresent:stack track by option.key')); };
  this.addServiceBtn = function(app) {  return app.element(by.id('addServiceBtn')); };
  this.addServiceHelpLink = function(app) {  return app.element(by.id('addServiceHelpLink')); };
  
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

// Make a selection in the Add Service dropdown
// TODO: Can this be done without using the index?
DashboardPage.prototype.selectServiceToAdd = function(application, index) {
  var addServiceDropdown = this.addServiceDropdown(application);
  
  // Expand the dropdown menu
  browser.wait(EC.elementToBeClickable(addServiceDropdown), 5000);
  addServiceDropdown.click();
  
  // Select (click) an option by index
  return this.addServiceDropdownOptions(application).then(function(options) {
    var selection = options[index];
    browser.wait(EC.elementToBeClickable(selection), 5000);
    selection.click();
  });
};

DashboardPage.prototype.launchApplication = function(application) {
  var launchBtn = this.launchBtn(application);
  launchBtn.isDisplayed().then(function(isDisplayed) {
    if (!isDisplayed) {
      application.click();
    }
  });
  
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
  shutdownBtn.isDisplayed().then(function(isDisplayed) {
    if (!isDisplayed) {
      application.click();
    }
  });
  
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
  deleteBtn.isDisplayed().then(function(isDisplayed) {
    if (!isDisplayed) {
      application.click();
    }
  });
  
    
  browser.wait(EC.elementToBeClickable(deleteBtn), 120000);
  deleteBtn.click();
  this.confirmBtn.click();
};

DashboardPage.prototype.shutdownAndRemoveAllApplications = function() {
  var self = this;
  
  // Shutdown and remove all applications
  this.applications.then(function(applications) {
    for (let i = 0; i < applications.length; i++) {
      let application = applications[i];
        
      browser.wait(EC.elementToBeClickable(application), 5000);
      //console.log("Expanding: " + i);
      application.click();
      
      // Success == running => we need to shut it down
      helpers.hasClass(application, 'panel-danger').then(function(hasClass) {
        if (!hasClass) {
          //console.log("Shutting down: " + i);
          let shutdownBtn = self.shutdownBtn(application);
          browser.wait(EC.elementToBeClickable(shutdownBtn), 120000);
          shutdownBtn.click();
          
          var confirmBtn = self.confirmBtn;
          browser.wait(EC.elementToBeClickable(confirmBtn), 120000);
          confirmBtn.click();
        }
        
        let deleteBtn = self.deleteBtn(application);
        browser.wait(EC.elementToBeClickable(deleteBtn), 120000);
        deleteBtn.click();
        self.confirmBtn.click();
        //console.log("Removed: " + i);
      });
    }
    
    return true;
  });
};

module.exports = DashboardPage;
