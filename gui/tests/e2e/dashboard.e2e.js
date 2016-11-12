/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var EC = protractor.ExpectedConditions;
    
// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  
  var WAIT_TIME_APPLICATION_SHUTDOWN = 120000;
  
  beforeAll(function(done) {
    helpers.beforeAll();
    dashboardPage.get();
    
    // TODO: Shut down all applications
    //console.log(dashboardPage.applications);
    
    var shutdownQueue = [];
    var removeQueue = [];
    
    var expandCount = 0;
    var stopCount = 0;
    var removeCount = 0;
    
    // FIXME: Shutdown and remove all applications
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
    beforeAll(function() {  
      // Install an application
      catalogPage.get(true);
    
      var target = 'toolmanager';
      helpers.selectByModel(catalogPage.cards, "spec.key", function(key) { 
        return key === target; // How to know we've found our match
      }, 
      function(card) {  // What to do with our match
        catalogPage.addBtn(card).click();
        dashboardPage.get(true);
      });
    });
    
    afterAll(function(done) { 
      // Remove the application
      dashboardPage.applications.each(function(application) {
        removeOne(application);
        done();
      })
    });
  
    // How to set up for test? Is it safe to simply delete all existing applications?
    it('should enumerate added applications', function() {
      expect(dashboardPage.applications.count()).toBe(1);
    });
    /*
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
      
    });*/
  });
});