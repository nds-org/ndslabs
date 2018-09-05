/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require('./helpers.e2e.js');

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LoginPage = require('./pages/login.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditServicePage = require('./pages/addEditService.page.js');

// Choose a spec with at least one optional dependency
var TEST_SPEC_KEY = 'clowder';
var TEST_SERVICE_INDEX_TO_ADD = 0;

var TEST_CFG_NAME = 'ENV_VAR_NAME';
var TEST_CFG_VALUE = 'some long env var that can be used for e2e testing purposes';

var TEST_VOLUME_FROM = 'AppData';
var TEST_VOLUME_TO = '/appdata';

var EC = protractor.ExpectedConditions;

// dashboard.e2e.js
describe('Labs Workbench Add Optional Application Service View', function() {
  "use strict";

  var navbar = new Navbar();
  var loginPage = new LoginPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var addServicePage = new AddEditServicePage();

  var stackId;
  var serviceId;
  
  var serviceKey;
  
  // FIXME: Test browser should scroll to card
  // FIXME: Move this to helpers
  var expectService = function(stackId, serviceKey) {
    if (!stackId || !serviceKey) {
      console.log(`Invalid serviceId: ${stackId}-${serviceKey}`);
      return false;
    }

    // Wait for new service to appear
    return browser.wait(function() {
      return helpers.selectByModel(dashboardPage.services(element), "svc.id", function(id) { 
        // NOTE: This *should* always be 7, but will never be -1
        return id === (stackId + '-' + serviceKey); // How to know we've found our match
      }, function(service) { 
        return service;
      });
    }, 5000);
  };
  
  // FIXME: Move this to helpers
  var expectBtn = function(enabled) {
    var saveBtn = addServicePage.saveBtn;
    helpers.scrollIntoView(saveBtn);
    expect(saveBtn.isDisplayed()).toBe(true);
    expect(saveBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
  };
  
  beforeAll(function() { 
    helpers.beforeAll();
    
    // Login and shutdown / remove any existing applications
    dashboardPage.get();
    dashboardPage.shutdownAndRemoveAllApplications();
    
    // Install and start a test application
    catalogPage.get(true);
    catalogPage.installApplication(TEST_SPEC_KEY).then(function() {
      // Click over to the dashboard
      catalogPage.viewApplicationOnDashboard(TEST_SPEC_KEY);
      
      // Save the application's ID
      dashboardPage.verify();
      dashboardPage.applications.then(function(applications) {
        var application = applications[0];
        dashboardPage.services(application).then(function(services) {
          var service = services[0];
          dashboardPage.serviceIdText(service).getText().then(function(text) {
            serviceId = text;
            stackId = text.split('-')[0];
          });
        });
      });
    });
  });
  
  beforeEach(function() {
    helpers.beforeEach();
    addServicePage.get(stackId, TEST_SERVICE_INDEX_TO_ADD, true);
    
    // Retrieve added service key from the URL
    browser.getCurrentUrl().then(function(url) {
      var fragments = url.split('/');
      // Last fragment is empty (routes now end with /)
      // Save second-to-last fragment as serviceKey
      serviceKey = fragments[fragments.length - 2];
      return serviceKey;
    });
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function(done) { 
    helpers.afterAll();
    
    // Shutdown and remove any existing applications
    dashboardPage.get(true);
    dashboardPage.shutdownAndRemoveAllApplications();
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    loginPage.verify();
    done();
  });
  
  it('should allow the user to abort the creation process', function() {
    // Click the cancel button
    var cancelBtn = addServicePage.cancelBtn;
    helpers.scrollIntoView(cancelBtn);
    cancelBtn.click();
    
    // Ensure that we are brought back to the dashboard page
    dashboardPage.verify();
  });
  
  it('should allow the user to save after entering all required fields', function() {
    //console.log("Adding service " + serviceKey + " to "+ stackId);
    
    // Click the save button
    var saveBtn = addServicePage.saveBtn;
    expectBtn(true);
    helpers.scrollIntoView(saveBtn);
    saveBtn.click();
    
    // Ensure that we are brought back to the catalog page
    dashboardPage.verify();
    
    // Verify that our new spec was added
    expectService(stackId, serviceKey).then(function(service) {
      // Remove this service to reset the test state
      var removeServiceBtn = dashboardPage.removeServiceBtn(service);
      removeServiceBtn.click();
    });
  });
  
  describe('Environment Tab', function() {
    beforeEach(function() {
      addServicePage.environmentTab.click();
      
      // Verify initial page state
      expect(addServicePage.cfgAddBtn.isPresent()).toBe(true);
      expect(addServicePage.cfgAddBtn.isDisplayed()).toBe(true);
      expect(addServicePage.cfgAddBtn.isEnabled()).toBe(false);
      
      expect(addServicePage.newCfgNameInvalidText.isPresent()).toBe(true);
      expect(addServicePage.newCfgNameInvalidText.getText()).toContain('New variable requires a name!');
      
      expect(addServicePage.newCfgValueInvalidText.isPresent()).toBe(true);
      expect(addServicePage.newCfgValueInvalidText.getText()).toContain('New variable requires a value!');
      
    });
    
    it('should allow the user to add custom environment variables', function() {
      // Verify initial page state
      expect(addServicePage.cfgAddBtn.isEnabled()).toBe(false);
      // Enter a variable name
      addServicePage.newCfgNameInput.sendKeys(TEST_CFG_NAME);
      expect(addServicePage.newCfgNameInvalidText.isPresent()).toBe(false);
      
      // Enter a variable value
      addServicePage.newCfgValueInput.sendKeys(TEST_CFG_VALUE);
      expect(addServicePage.newCfgValueInvalidText.isPresent()).toBe(false);
      
      // Ensure that we can now add the config
      expect(addServicePage.newCfgValidText.getText()).toContain('New variable is valid!');
      expect(addServicePage.cfgAddBtn.isEnabled()).toBe(true);
      addServicePage.cfgAddBtn.click();
    });
    
    describe('With Configs', function() {
      beforeEach(function() {
        addServicePage.addConfig(TEST_CFG_NAME, TEST_CFG_VALUE);
      });
      
      it('should prevent the user from adding duplicate variables', function() {
        // Verify initial page state
        expect(addServicePage.newCfgNameInvalidText.getText()).toContain('New variable requires a name!');
        expect(addServicePage.newCfgValueInvalidText.getText()).toContain('New variable requires a value!');
                
        // Enter a variable value
        addServicePage.newCfgValueInput.sendKeys(TEST_CFG_VALUE);
        expect(addServicePage.newCfgValueInvalidText.isPresent()).toBe(false);
        
        // Enter a variable name
        addServicePage.newCfgNameInput.sendKeys(TEST_CFG_NAME);
        expect(addServicePage.newCfgNameInvalidText.isPresent()).toBe(true);
        expect(addServicePage.newCfgNameInvalidText.getText()).toContain('New variable name is not unique!');

        // Ensure that we cannot add the config
        expect(addServicePage.newCfgValidText.isPresent()).toBe(false);
        expect(addServicePage.cfgAddBtn.isEnabled()).toBe(false);
      });
      
      it('should allow the user to remove custom environment variables', function() {
        addServicePage.configs.then(function(configs) {
          for(let i = 0; i < configs.length; i++) {
            let cfg = configs[i];
            expect(addServicePage.cfgRemoveBtn(cfg).isPresent()).toBe(true);
            expect(addServicePage.cfgRemoveBtn(cfg).isDisplayed()).toBe(true);
            expect(addServicePage.cfgRemoveBtn(cfg).isEnabled()).toBe(true);
            addServicePage.cfgRemoveBtn(cfg).click();
          }
        });
      });
    });
  });
  
  describe('Data Tab', function() {
    beforeEach(function() {
      addServicePage.dataTab.click();
      expect(addServicePage.volumeAddBtn.isPresent()).toBe(true);
      expect(addServicePage.volumeAddBtn.isDisplayed()).toBe(true);
    });
    
    it('should allow the user to add custom volume mounts', function() {
      // Verify initial page state
      expect(addServicePage.volumeAddBtn.isEnabled()).toBe(false);
      
      // Enter a mount source 
      addServicePage.newVolumeFrom.sendKeys(TEST_VOLUME_FROM);
      
      // Enter a mount destnation
      addServicePage.newVolumeTo.sendKeys(TEST_VOLUME_TO);
      
      // Ensure that we can now add the volume
      expect(addServicePage.volumeAddBtn.isEnabled()).toBe(true);
      addServicePage.volumeAddBtn.click();
      addServicePage.saveBtn.click();
    });
    
    describe('With Volumes', function() {
      beforeEach(function() {
        addServicePage.addVolume(TEST_VOLUME_FROM, TEST_VOLUME_TO);
      });
      
      it('should prevent the user from adding duplicate volumes', function() {
        // Verify initial page state
        expect(addServicePage.volumeAddBtn.isEnabled()).toBe(false);
        
        // Enter a mount source 
        addServicePage.newVolumeFrom.sendKeys(TEST_VOLUME_FROM);
        
        // Enter a mount destnation
        addServicePage.newVolumeTo.sendKeys(TEST_VOLUME_TO);
        
        // Ensure that we cannot add the duplicate volume
        expect(addServicePage.volumeAddBtn.isEnabled()).toBe(false);
      });
      
      it('should allow the user to remove custom volumes', function() {
        addServicePage.volumes.then(function(volumes) {
          for(let i = 0; i < volumes.length; i++) {
            let vol = volumes[i];
            expect(addServicePage.volumeRemoveBtn(vol).isPresent()).toBe(true);
            expect(addServicePage.volumeRemoveBtn(vol).isDisplayed()).toBe(true);
            expect(addServicePage.volumeRemoveBtn(vol).isEnabled()).toBe(true);
            addServicePage.volumeRemoveBtn(vol).click();
          }
        });
      });
    });
  });
  
  describe('Docker Tab', function() {
    beforeEach(function() {
      addServicePage.dockerTab.click();
    });
    
    it('should allow the user to change the docker tag of the service', function() {
      expect(addServicePage.dockerImageTagSelect.isPresent()).toBe(true);
      expect(addServicePage.dockerImageTagSelect.isDisplayed()).toBe(true);
    });
  });
});