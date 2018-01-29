/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var LandingPage = require('./landing.page.js');
var LoginPage = require('./login.page.js');
var Navbar = require('./navbar.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;
var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;

var PAGE_TITLE = 'Labs Workbench Dashboard';
var PAGE_ROUTE = /https?\:\/\/.+\/dashboard\/\#?\/?home(\?t=.+|expand=.)?/;

var EC = protractor.ExpectedConditions;

var DashboardPage = function() {
  "use strict";

  this.helperText = element(by.id('dashHelperText'));
  this.catalogLink = element(by.id('catalogLink'));

  // Repeaters
  this.firstApplication = element.all(by.repeater("stack in configuredStacks | orderBy:['name','id'] track by stack.id")).first()
  this.applications = element.all(by.repeater("stack in configuredStacks | orderBy:['name','id'] track by stack.id"));
  this.services = function(app) {  return app.all(by.repeater("svc in stack.services track by svc.id")); };
  this.firstService = function(app) {  return app.all(by.repeater("svc in stack.services track by svc.id")).first(); };

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
  "use strict";

  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var loginPage = new LoginPage();

  // Attempt to navigate to the dashboard

  // Log in, if redirected to login
  if (loggedIn) {
    //browser.get(TEST_HOSTNAME + '/dashboard/home/');
    landingPage.get();
    navbar.clickApplicationsNav();
  } else {
    loginPage.get();
    loginPage.usernameInput.sendKeys(TEST_USERNAME);
    loginPage.passwordInput.sendKeys(TEST_PASSWORD);
    loginPage.loginBtn.click();
  }

  this.verify();
};

// Ensure we are on the dashboard page
DashboardPage.prototype.verify = function() {
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Make a selection in the Add Service dropdown
// TODO: Can this be done without using the index?
DashboardPage.prototype.selectServiceToAdd = function(application, index) {
  "use strict";

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
  "use strict";

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
  "use strict";

  var shutdownBtn = this.shutdownBtn(application);
  shutdownBtn.isDisplayed().then(function(isDisplayed) {
    if (!isDisplayed) {
      application.click();
    }
  });

  // Wait for the shutdown button to be clickable
  browser.wait(EC.elementToBeClickable(shutdownBtn), 120000);
  shutdownBtn.click();

  browser.wait(EC.elementToBeClickable(this.confirmBtn), 5000);
  this.confirmBtn.click();

  // Wait for the application to shut down before returning
  browser.wait(function() {
    return helpers.hasClass(application, 'panel-danger');
  }, 120000);
  expect(helpers.hasClass(application, 'panel-danger')).toBe(true);
};

DashboardPage.prototype.removeApplication = function(application) {
  "use strict";

  var deleteBtn = this.deleteBtn(application);
  deleteBtn.isDisplayed().then(function(isDisplayed) {
    if (!isDisplayed) {
      application.click();
    }
  });

  browser.wait(EC.elementToBeClickable(deleteBtn), 120000);
  deleteBtn.click();
  browser.wait(EC.elementToBeClickable(this.confirmBtn), 5000);
  this.confirmBtn.click();
  browser.wait(EC.invisibilityOf(application), 5000);
};

DashboardPage.prototype.shutdownAndRemoveAllApplications = function() {
  "use strict";

  var self = this;

  var shutdownAndRemove = function(application) {
    return function(hasClass) {
      if (!hasClass) {
        //console.log("Shutting down: " + i);
        self.shutdownApplication(application);
      }

      //console.log("Removing: " + i);
      return self.removeApplication(application);
    };
  };

  // Shutdown and remove all applications
  return this.applications.then(function(applications) {
    for (let i = 0; i < applications.length; i++) {
      let application = applications[i];

      browser.wait(EC.elementToBeClickable(application), 5000);
      //console.log("Expanding: " + i);
      application.click();

      // Success == running => we need to shut it down
      helpers.hasClass(application, 'panel-danger').then(shutdownAndRemove(application));
    }

    browser.waitForAngular();
    expect(self.applications.count()).toBe(0);

    //console.log("Done with shutdownAndRemoveAllApplications");
    return true;
  });
};

module.exports = DashboardPage;
