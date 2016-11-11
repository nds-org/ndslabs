/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');


    
// dashboard.e2e.js
describe('Labs Workbench Dashboard View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var catalogPage = new CatalogPage();
  var dashboardPage = new DashboardPage();
  
  
  var forEachApplication = function(func) {
    var queue = [];
    return dashboardPage.applications.each(function(application) {
      queue.push(application);
    }).then(function() {
      // Operate on all applications
      while (queue.length > 0) {
        func(queue.shift());
        helpers.sleep(1000);
      }
    });
  };
  
  
  var shutdownOne = function(application) {
    application.click();
    var shutdownBtn = dashboardPage.shutdownBtn(application);
    if (shutdownBtn.isPresent()) {
      shutdownBtn.click();
      dashboardPage.confirmBtn.click();
    }
  };
  
  var removeOne = function(application) {
    application.click();
    var deleteBtn = dashboardPage.deleteBtn(application);
    if (deleteBtn.isPresent()) {
      deleteBtn.click();
      dashboardPage.confirmBtn.click();
      helpers.sleep(1000);
    }
  };
  
  beforeAll(function(done) { 
    helpers.beforeAll();
    dashboardPage.get();
    
    // TODO: Shut down all applications
    //console.log(dashboardPage.applications);
    
    var shutdownQueue = [];
    var removeQueue = [];
    
    // FIXME: Remove all applications
    dashboardPage.applications.each(function(application) {
      shutdownQueue.push(application);
      removeQueue.push(application);
    }).then(function() {
      // Remove all applications
      while (removeQueue.length > 0) {
        dashboardPage.removeApplication(removeQueue.shift());
        helpers.sleep(1000);
      }
      done();
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
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    landingPage.verify();
  });
  
  // How to set up for test? Is it safe to simply delete all existing applications?
  it('should link to the catalog page if no applications are present', function() {
    console.log("Running test spec...");
    dashboardPage.catalogLink.click();
    catalogPage.verify();
    
    /*dashboardPage.removeApp().then(function() {
      dashboardPage.catalogLink.click();
    });*/
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