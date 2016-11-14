/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var AddOrEditServicePage = require('./pages/addEditService.page.js');

var EC = protractor.ExpectedConditions;

var TEXT_BASIC_AUTH_ENABLED = 'HTTP Basic Authentication Enabled';
var TEXT_BASIC_AUTH_DISABLED = 'HTTP Basic Authentication Disabled';
  
var TEST_NEW_APPLICATION_NAME = 'New Label';

var WAIT_TIME_APPLICATION_STARTUP = 120000;
var WAIT_TIME_APPLICATION_SHUTDOWN = 120000;
    
// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  var addServicePage = new AddOrEditServicePage();
  var editServicePage = new AddOrEditServicePage();
  
  beforeAll(function(done) {
    helpers.beforeAll();
    dashboardPage.get();
    
    // Shutdown and remove all applications
    dashboardPage.applications.then(function(applications) {
      for (let i = 0; i < applications.length; i++) {
        let application = applications[i];
          
        browser.wait(EC.elementToBeClickable(application), WAIT_TIME_APPLICATION_SHUTDOWN);
        console.log("Expanding: " + i);
        application.click();
        
        // Success == running => we need to shut it down
        helpers.hasClass(application, 'panel-danger').then(function(hasClass) {
          if (!hasClass) {
            console.log("Shutting down: " + i);
            let shutdownBtn = dashboardPage.shutdownBtn(application);
            shutdownBtn.click();
            dashboardPage.confirmBtn.click();
          }
          
          let deleteBtn = dashboardPage.deleteBtn(application);
          browser.wait(EC.elementToBeClickable(deleteBtn), WAIT_TIME_APPLICATION_SHUTDOWN);
          deleteBtn.click();
          dashboardPage.confirmBtn.click();
          console.log("Removed: " + i);
        });
      }
      
      return applications;
    }).then(function() {
      done();
    });
  }, 600000);
  
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
    var installApplication = function(target) {
      helpers.selectByModel(catalogPage.cards, "spec.key", function(key) { 
        return key === target; // How to know we've found our match
      }, 
      function(card) {  // What to do with our match
        catalogPage.addBtn(card).click();
        dashboardPage.get(true);
      });
    };
    
    beforeAll(function() {  
      // Install an application
      catalogPage.get(true);
      installApplication('toolmanager');
    }, 120000);
    
    afterAll(function(done) { 
      // Remove the application
      dashboardPage.applications.each(function(application) {
        dashboardPage.removeApplication(application);
        done();
      })
    }, 120000);
    
    it('should allow the user to change the label of an application', function() {
      dashboardPage.applications.each(function(application) {
        dashboardPage.applicationLabel(application).getText().then(function(oldLabel) {
          // Rename an application
          browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), 5000);
          dashboardPage.renameBtn(application).click();
          
          // Expect previous label to be the default value
          browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), 5000);
          browser.wait(EC.visibilityOf(dashboardPage.nameInput), 5000);
          expect(dashboardPage.nameInput.getAttribute('value')).toBe(oldLabel);
          
          // Input new application label
          dashboardPage.nameInput.clear();
          dashboardPage.nameInput.sendKeys(TEST_NEW_APPLICATION_NAME);
          dashboardPage.confirmBtn.click();
          
          // Ensure that the name changed as expected
          browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), TEST_NEW_APPLICATION_NAME), 5000);
          expect(dashboardPage.applicationLabel(application).getText()).toBe(TEST_NEW_APPLICATION_NAME);
        
          // Revert label back to reset test state
          browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), 5000);
          dashboardPage.renameBtn(application).click();
          browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), 5000);
          browser.wait(EC.visibilityOf(dashboardPage.nameInput), 5000);
          dashboardPage.nameInput.clear();
          dashboardPage.nameInput.sendKeys(oldLabel);
          dashboardPage.confirmBtn.click();
          
          // Ensure that the name reverted as expected
          browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), oldLabel), 5000);
          expect(dashboardPage.applicationLabel(application).getText()).toBe(oldLabel);
        });
      });
    });
    
    it('should allow basic auth toggle on select system applications', function() {
      dashboardPage.applications.each(function(application) {
        // Expand application header
        application.click();
        browser.wait(EC.textToBePresentInElement(dashboardPage.toggleAuthBtn(application), 'Disabled'), 5000);
        expect(dashboardPage.toggleAuthBtn(application).getText()).toBe(TEXT_BASIC_AUTH_DISABLED);
        
        // Enable basic auth
        dashboardPage.toggleAuthBtn(application).click();
        browser.wait(EC.textToBePresentInElement(dashboardPage.toggleAuthBtn(application), 'Enabled'), 5000);
        expect(dashboardPage.toggleAuthBtn(application).getText()).toBe(TEXT_BASIC_AUTH_ENABLED);
        
        // Disable auth again to reset test state
        dashboardPage.toggleAuthBtn(application).click();
        browser.wait(EC.textToBePresentInElement(dashboardPage.toggleAuthBtn(application), 'Disabled'), 5000);
        expect(dashboardPage.toggleAuthBtn(application).getText()).toBe(TEXT_BASIC_AUTH_DISABLED);
      });
    });
    
    it('should prevent basic auth toggle on user applications', function() {
      // TODO
    });
    
    it('should prevent basic auth toggle on authRequired applications', function() {
      // TODO
    });
    
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
    
    it('should allow the user to add optional services to the application', function() {
      // TODO
    });
  
    // After starting an application
    describe('Running', function() {      
      beforeAll(function(done) {  
        // Start the Application
        dashboardPage.applications.each(function(application) {
          dashboardPage.launchApplication(application);
          done();
        });
      }, 120000);
      
      afterAll(function(done) { 
        // Stop the application
        dashboardPage.applications.each(function(application) {
          dashboardPage.shutdownApplication(application);
          done();
        });
      }, 120000);
      
      it('should link to available endpoints on the service', function() {
        dashboardPage.applications.each(function(application) {
          application.click();
          
          dashboardPage.services(application).each(function(service) {
            expect(dashboardPage.endpointLinks(service).count()).toBe(1);
            
            dashboardPage.serviceIdText(service).getText().then(function(serviceId) {
              dashboardPage.endpointLinks(service).first().click();
              helpers.expectNewTabOpen(new RegExp("https\:\/\/" + serviceId + "\..*"));
          
              // TODO: How to handle basic auth?
            });
          });
        });
      });
    
      it('should allow the user to change the label of an application', function() {
        dashboardPage.applications.each(function(application) {
          dashboardPage.applicationLabel(application).getText().then(function(oldLabel) {
            // Rename an application
            browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), 5000);
            dashboardPage.renameBtn(application).click();
            
            // Expect previous label to be the default value
            browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), 5000);
            browser.wait(EC.visibilityOf(dashboardPage.nameInput), 5000);
            expect(dashboardPage.nameInput.getAttribute('value')).toBe(oldLabel);
            
            // Input new application label
            dashboardPage.nameInput.clear();
            dashboardPage.nameInput.sendKeys(TEST_NEW_APPLICATION_NAME);
            dashboardPage.confirmBtn.click();
            
            // Ensure that the name changed as expected
            browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), TEST_NEW_APPLICATION_NAME), 5000);
            expect(dashboardPage.applicationLabel(application).getText()).toBe(TEST_NEW_APPLICATION_NAME);
          
            // Revert label back to reset test state
            browser.wait(EC.elementToBeClickable(dashboardPage.renameBtn(application)), 5000);
            dashboardPage.renameBtn(application).click();
            browser.wait(EC.visibilityOf(dashboardPage.stackRenameModal), 5000);
            browser.wait(EC.visibilityOf(dashboardPage.nameInput), 5000);
            dashboardPage.nameInput.clear();
            dashboardPage.nameInput.sendKeys(oldLabel);
            dashboardPage.confirmBtn.click();
            
            // Ensure that the name reverted as expected
            browser.wait(EC.textToBePresentInElement(dashboardPage.applicationLabel(application), oldLabel), 5000);
            expect(dashboardPage.applicationLabel(application).getText()).toBe(oldLabel);
          });
        });
      });
      
      it('should allow the user to view the console of a running application', function() {
        dashboardPage.applications.each(function(application) {
          application.click();
          dashboardPage.services(application).each(function(service) {
            browser.wait(EC.elementToBeClickable(dashboardPage.consoleBtn(service)), WAIT_TIME_APPLICATION_STARTUP);
            dashboardPage.consoleBtn(service).click();
            //consolePage.verify();
            helpers.expectNewTabOpen(/.*console.*/);
            
            // TODO: Verify basic console functionality
          });
        });
      });
      
      it('should allow the user to view the config of a running application', function() {
        dashboardPage.applications.each(function(application) {
          application.click();
          dashboardPage.services(application).each(function(service) {
            browser.wait(EC.elementToBeClickable(dashboardPage.viewConfigBtn(application)), 5000);
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
            browser.wait(EC.elementToBeClickable(dashboardPage.viewLogsBtn(application)), 5000);
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
        
        browser.wait(EC.elementToBeClickable(dashboardPage.deleteBtn(application)), WAIT_TIME_APPLICATION_STARTUP);
        dashboardPage.deleteBtn(application).click();
        dashboardPage.confirmBtn.click();
      });
      
      // Reinstall the application to reset test state
      catalogPage.get(true);
      installApplication('toolmanager');
      
      
      dashboardPage.get(true);
    }, 120000);
  });
});