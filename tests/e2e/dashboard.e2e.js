/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var ConsolePage = require('./pages/console.page.js');
var AddOrEditServicePage = require('./pages/addEditService.page.js');

var EC = protractor.ExpectedConditions;
  
var TEST_NEW_APPLICATION_NAME = 'New Label';

var TEXT_BASIC_AUTH_ENABLED = 'HTTP Basic Authentication Enabled';
var TEXT_BASIC_AUTH_DISABLED = 'HTTP Basic Authentication Disabled';

var WAIT_TIME_ALL_APPLICATIONS_SHUTDOWN = 600000;

var WAIT_TIME_ELEMENT_CLICKABLE = 5000;

var WAIT_TIME_APPLICATION_STARTUP = 120000;
var WAIT_TIME_APPLICATION_SHUTDOWN = 120000;

var WAIT_TIME_APPLICATION_INSTALL = 30000;
var WAIT_TIME_APPLICATION_REMOVE = 30000;

var TIMEOUT_EXPECT_NEW_TAB = 30000;
  
var TEST_SPEC_KEY = 'latis';
    
// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  "use strict";

  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var consolePage = new ConsolePage();
  var addServicePage = new AddOrEditServicePage();
  var editServicePage = new AddOrEditServicePage();

  beforeAll(function() { 
    helpers.beforeAll();
    
    // Login and shutdown / remove any existing applications
    dashboardPage.get();
    dashboardPage.shutdownAndRemoveAllApplications();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    dashboardPage.get(true);
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
    
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    landingPage.verify();
  });
  
  // How to set up for test? Is it safe to simply delete all existing applications?
  it('should link to the catalog page if no applications are present', function() {
    dashboardPage.catalogLink.click();
    catalogPage.verify();
  });

  describe('With Applications', function() {
    beforeAll(function() {
      // Install and start a test application
      catalogPage.get(true);
      catalogPage.installApplication(TEST_SPEC_KEY).then(function() {
        // Click over to the dashboard
        catalogPage.viewApplicationOnDashboard(TEST_SPEC_KEY);
        dashboardPage.verify();
      });
    }, WAIT_TIME_APPLICATION_INSTALL);
    
    beforeEach(function() {
      
    });
    
    afterAll(function(done) {
      // Save the application's ID 
      // CAUTION: Value is volatile - it can change mid-test
      dashboardPage.applications.then(function(applications) {
          dashboardPage.removeApplication(applications[0]);
          done();
      });
    }, WAIT_TIME_APPLICATION_REMOVE);
    
    it('should allow the user to change the label of an application', function() {
      dashboardPage.applications.each(function(application) {
        dashboardPage.applicationLabel(application).getText().then(function(oldLabel) {
          // Rename an application
          browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), WAIT_TIME_ELEMENT_CLICKABLE);
          dashboardPage.renameBtn(application).click();
          
          // Expect previous label to be the default value
          browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), WAIT_TIME_ELEMENT_CLICKABLE);
          browser.wait(EC.visibilityOf(dashboardPage.nameInput), WAIT_TIME_ELEMENT_CLICKABLE);
          expect(dashboardPage.nameInput.getAttribute('value')).toBe(oldLabel);
          
          // Input new application label
          dashboardPage.nameInput.clear();
          dashboardPage.nameInput.sendKeys(TEST_NEW_APPLICATION_NAME);
          dashboardPage.confirmBtn.click();
          
          // Ensure that the name changed as expected
          browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), TEST_NEW_APPLICATION_NAME), WAIT_TIME_ELEMENT_CLICKABLE);
          expect(dashboardPage.applicationLabel(application).getText()).toBe(TEST_NEW_APPLICATION_NAME);
        
          // Revert label back to reset test state
          browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), WAIT_TIME_ELEMENT_CLICKABLE);
          dashboardPage.renameBtn(application).click();
          browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), WAIT_TIME_ELEMENT_CLICKABLE);
          browser.wait(EC.visibilityOf(dashboardPage.nameInput), WAIT_TIME_ELEMENT_CLICKABLE);
          dashboardPage.nameInput.clear();
          dashboardPage.nameInput.sendKeys(oldLabel);
          dashboardPage.confirmBtn.click();
          
          // Ensure that the name reverted as expected
          browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), oldLabel), WAIT_TIME_ELEMENT_CLICKABLE);
          expect(dashboardPage.applicationLabel(application).getText()).toBe(oldLabel);
        });
      });
    });
    
    it('should allow basic auth toggle on select system applications', function() {
      dashboardPage.applications.each(function(application) {
        // Expand application header
        application.click();
        browser.wait(EC.textToBePresentInElement(dashboardPage.toggleAuthBtn(application), 'Disabled'), WAIT_TIME_ELEMENT_CLICKABLE);
        expect(dashboardPage.toggleAuthBtn(application).getText()).toBe(TEXT_BASIC_AUTH_DISABLED);
        
        // Enable basic auth
        dashboardPage.toggleAuthBtn(application).click();
        browser.wait(EC.textToBePresentInElement(dashboardPage.toggleAuthBtn(application), 'Enabled'), WAIT_TIME_ELEMENT_CLICKABLE);
        expect(dashboardPage.toggleAuthBtn(application).getText()).toBe(TEXT_BASIC_AUTH_ENABLED);
        
        // Disable auth again to reset test state
        dashboardPage.toggleAuthBtn(application).click();
        browser.wait(EC.textToBePresentInElement(dashboardPage.toggleAuthBtn(application), 'Disabled'), WAIT_TIME_ELEMENT_CLICKABLE);
        expect(dashboardPage.toggleAuthBtn(application).getText()).toBe(TEXT_BASIC_AUTH_DISABLED);
      });
    });
    
    /*it('should prevent basic auth toggle on user applications', function() {
      // TODO
    });
    
    it('should prevent basic auth toggle on authRequired applications', function() {
      // TODO
    });*/
    
    it('should link to each application service\'s help documentation', function() {
      dashboardPage.applications.each(function(application) {
        application.click();
        dashboardPage.services(application).each(function(service) {
          expect(dashboardPage.helpLink(service).isPresent()).toBe(true);
          
          // TODO: Verify destination
        });
      });
    });
    
    it('should allow the user to edit an application service', function() {
      dashboardPage.applications.each(function(application) {
        application.click();
        dashboardPage.services(application).each(function(service) {
          dashboardPage.editServiceBtn(service).click();
          editServicePage.verify();
        });
      });
    });
    
    /*it('should allow the user to add optional services to their application', function() {
      // TODO
    });
    
    it('should allow the user to remove optional services from their application', function() {
      // TODO
    });*/
    
    // Test order should not affect success
    it('should allow the user to remove the application', function() {
      dashboardPage.applications.each(function(application) {
        application.click();
        var deleteBtn = dashboardPage.deleteBtn(application);
        browser.wait(EC.elementToBeClickable(deleteBtn), WAIT_TIME_APPLICATION_STARTUP);
        deleteBtn.click();
        dashboardPage.confirmBtn.click();
      });
      
      // Reinstall the application to reset test state
      catalogPage.get(true);
      catalogPage.installApplication(TEST_SPEC_KEY).then(function() {
        dashboardPage.get(true);
      });
    }, WAIT_TIME_APPLICATION_REMOVE);
  
    // After starting an application
    describe('Running', function() {      
      beforeAll(function(done) {  
        // Start the Application
        dashboardPage.applications.each(function(application) {
          dashboardPage.launchApplication(application);
          done();
        });
      }, WAIT_TIME_APPLICATION_STARTUP);
      
      afterAll(function(done) { 
        // Stop the application
        dashboardPage.applications.each(function(application) {
          dashboardPage.shutdownApplication(application);
          done();
        });
      }, WAIT_TIME_APPLICATION_SHUTDOWN);
      
      it('should link to available endpoints on the service', function(done) {
        dashboardPage.applications.each(function(application) {
          application.click();
          
          dashboardPage.services(application).each(function(service) {
            expect(dashboardPage.endpointLinks(service).count()).toBe(1);
            
            dashboardPage.serviceIdText(service).getText().then(function(serviceId) {
              dashboardPage.endpointLinks(service).first().click();
              helpers.expectNewTabOpen(new RegExp("https\:\/\/" + serviceId + "\..*")).then(function() {
                done();
              });
          
              // TODO: How to handle basic auth?
              // For now, auth manually when prompted.. later test runs should then pass
            });
          });
        });
      }, TIMEOUT_EXPECT_NEW_TAB);
    
      it('should allow the user to change the label of an application', function() {
        dashboardPage.applications.each(function(application) {
          dashboardPage.applicationLabel(application).getText().then(function(oldLabel) {
            // Rename an application
            browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), WAIT_TIME_ELEMENT_CLICKABLE);
            dashboardPage.renameBtn(application).click();
            
            // Expect previous label to be the default value
            browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), WAIT_TIME_ELEMENT_CLICKABLE);
            browser.wait(EC.visibilityOf(dashboardPage.nameInput), WAIT_TIME_ELEMENT_CLICKABLE);
            expect(dashboardPage.nameInput.getAttribute('value')).toBe(oldLabel);
            
            // Input new application label
            dashboardPage.nameInput.clear();
            dashboardPage.nameInput.sendKeys(TEST_NEW_APPLICATION_NAME);
            dashboardPage.confirmBtn.click();
            
            // Ensure that the name changed as expected
            browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), TEST_NEW_APPLICATION_NAME), WAIT_TIME_ELEMENT_CLICKABLE);
            expect(dashboardPage.applicationLabel(application).getText()).toBe(TEST_NEW_APPLICATION_NAME);
          
            // Revert label back to reset test state
            browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), WAIT_TIME_ELEMENT_CLICKABLE);
            dashboardPage.renameBtn(application).click();
            browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), WAIT_TIME_ELEMENT_CLICKABLE);
            browser.wait(EC.visibilityOf(dashboardPage.nameInput), WAIT_TIME_ELEMENT_CLICKABLE);
            dashboardPage.nameInput.clear();
            dashboardPage.nameInput.sendKeys(oldLabel);
            dashboardPage.confirmBtn.click();
            
            // Ensure that the name reverted as expected
            browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), oldLabel), WAIT_TIME_ELEMENT_CLICKABLE);
            expect(dashboardPage.applicationLabel(application).getText()).toBe(oldLabel);
          });
        });
      });
      
      it('should allow the user to view the console of a running application', function(done) {
        dashboardPage.applications.each(function(application) {
          application.click();
          dashboardPage.services(application).each(function(service) {
            browser.wait(EC.elementToBeClickable(dashboardPage.consoleBtn(service)), WAIT_TIME_APPLICATION_STARTUP);
            dashboardPage.consoleBtn(service).click();
            //consolePage.verify();
            helpers.expectNewTabOpen(/.*console.*/).then(function() {
              done();
            });
            
            // TODO: Verify basic console functionality
          });
        });
      }, TIMEOUT_EXPECT_NEW_TAB);
      
      it('should allow the user to view the config of a running application', function() {
        dashboardPage.applications.each(function(application) {
          application.click();
          dashboardPage.services(application).each(function(service) {
            browser.wait(EC.elementToBeClickable(dashboardPage.viewConfigBtn(application)), WAIT_TIME_ELEMENT_CLICKABLE);
            dashboardPage.viewConfigBtn(service).click();
            
            // Expect the viewConfigModal to pop up
            expect(dashboardPage.viewConfigModal.isPresent()).toBe(true);
            expect(dashboardPage.viewConfigModal.isDisplayed()).toBe(true);
            
            // Dismiss the modal
            dashboardPage.cancelBtn.click();
          });
        });
      });
      
      it('should allow the user to view logs of a running application', function() {
        dashboardPage.applications.each(function(application) {
          application.click();
          dashboardPage.services(application).each(function(service) {
            browser.wait(EC.elementToBeClickable(dashboardPage.viewLogsBtn(application)), WAIT_TIME_ELEMENT_CLICKABLE);
            dashboardPage.viewLogsBtn(service).click();
            
            // Expect the viewLogsModal to pop up
            expect(dashboardPage.viewLogsModal.isPresent()).toBe(true);
            expect(dashboardPage.viewLogsModal.isDisplayed()).toBe(true);
            
            // Dismiss the modal
            dashboardPage.cancelBtn.click();
          });
        });
      });
    
      it('should link to the application\'s help documentation', function() {
        dashboardPage.applications.each(function(application) {
          application.click();
          dashboardPage.services(application).each(function(service) {
            expect(dashboardPage.helpLink(service).isPresent()).toBe(true);
            
            // TODO: Verify destination
          });
        });
      });
      
      it('should allow the user to shutdown a running application', function() {
        dashboardPage.applications.each(function(application) {
          dashboardPage.shutdownApplication(application);
          
          browser.wait(EC.elementToBeClickable(dashboardPage.launchBtn(application)), WAIT_TIME_APPLICATION_STARTUP);
          dashboardPage.launchApplication(application);
          
          browser.wait(EC.elementToBeClickable(dashboardPage.shutdownBtn(application)), WAIT_TIME_APPLICATION_STARTUP);
        });
      }, 300000);
    });
  });
});