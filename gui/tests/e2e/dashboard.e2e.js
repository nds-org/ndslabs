/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var EC = protractor.ExpectedConditions;

// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
    dashboardPage.get();
    
    // TODO: Shut down all applications
    console.log(dashboardPage.applications);
    
    // FIXME: Remove all applications
    dashboardPage.applications.each(function(application, index) {
      var isClickableApp = EC.elementToBeClickable(application);
      browser.wait(isClickableApp, 5000);
      application.click();
      
      var deleteBtn = application.element(by.id('deleteBtn'));
      var isClickable = EC.elementToBeClickable(deleteBtn);
      
      browser.wait(isClickable, 5000);
      
      deleteBtn.click();
      
      var confirmBtn = element(by.id('confirmBtn'));
      var isClickableConf = EC.elementToBeClickable(confirmBtn);
      
      browser.wait(isClickableConf, 5000);
      confirmBtn.click();
    });
    
    
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
    shared.navbar.expandAccountDropdown();
    shared.navbar.clickSignOut();
    landing.verify();
  });
  
  // How to set up for test? Is it safe to simply delete all existing applications?
  it('should link to the catalog page if no applications are present', function() {
    //dashboardPage.catalogLink.click();
    //catalogPage.verify();
  });
  /*
  describe('With Applications', function() {
    beforeAll(function() {  
      // Install an application
    });
    
    afterAll(function() { 
      // Remove the application
    });
  
    // How to set up for test? Is it safe to simply delete all existing applications?
    it('should enumerate added applications', function() {
      dashboard.clickCatalogLink();
      catalog.verify();
    });
    
    it('should allow the user to change the label of an application', function() {
      
    });
    
    it('should allow basic auth toggle on select system applications', function() {
      
    });
    
    it('should prevent basic auth toggle on user applications', function() {
      
    });
    
    it('should prevent basic auth toggle on authRequired applications', function() {
      
    });
    
    it('should link to the application\'s help documentation', function() {
      
    });
    
    it('should allow the user to edit an application service', function() {
      
    });
    
    it('should allow the user to add optional services to the application', function() {
      
    });
    
    // FIXME: Test order should not affect success
    it('should allow the user to launch the application', function() {
      
    });
  
    // After starting an application
    describe('Running', function() {
      beforeAll(function() {  
        // Start the Application
      });
      afterAll(function() { 
        // Stop the application
      });
      
      it('should link to available endpoints on the service', function() {
        
      });
      
      it('should allow the user to change the label of a running application', function() {
        
      });
      
      it('should allow the user to view the console of a running application', function() {
        
      });
      
      it('should allow the user to view the config of a running application', function() {
        
      });
      
      it('should allow the user to view logs of a running application', function() {
        
      });
    
      it('should link to the application\'s help documentation', function() {
        
      });
      
      it('should allow the user to shutdown a running application', function() {
        
      });
    });
    
    // FIXME: Test order should not affect success
    it('should allow the user to remove the application', function() {
      
    });
  });*/
});