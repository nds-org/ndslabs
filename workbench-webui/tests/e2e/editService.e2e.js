/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var LoginPage = require('./pages/login.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditServicePage = require('./pages/addEditService.page.js');

// Choose a spec with at least one optional dependency
var TEST_SPEC_KEY = 'clowder';

var TEST_VALID_CFG_MSG = 'New variable is valid!';
var TEST_INVALID_CFG_MSG_NAME_UNIQUE = 'New variable name is not unique!';
var TEST_INVALID_CFG_MSG_NAME_REQUIRED = 'New variable requires a name!';
var TEST_INVALID_CFG_MSG_VALUE_REQUIRED = 'New variable requires a value!';

var TEST_CFG_NAME = 'ENV_VAR_NAME';
var TEST_CFG_VALUE = 'some long env var that can be used for e2e testing purposes';

var TEST_VOLUME_FROM = 'AppData';
var TEST_VOLUME_TO = '/appdata';

var EC = protractor.ExpectedConditions;

// dashboard.e2e.js
describe('Labs Workbench Edit Application Service View', function() {
  "use strict";

  var navbar = new Navbar();
  var loginPage = new LoginPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var editServicePage = new AddEditServicePage();

  var stackId;
  var serviceId;
  
  var serviceKey;
  
  // FIXME: Make this less awful.. 
  // XXX: is this even necessary? I feel like the click handler does these things for us
  var clickBtn = function(btn) {
    btn.isPresent().then(function(isPresent) {
    if (isPresent) {
      btn.isDisplayed().then(function(isDisplayed) {
        if (isDisplayed) {
          btn.isEnabled().then(function(isEnabled) {
            if (isEnabled) {
              btn.click();
            }
          });
        }
      });
    }
  });
  };
  
  // FIXME: Test browser should scroll to card
  // FIXME: Move this to helpers
  var expectService = function(stackId, serviceKey) {
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
    var saveBtn = editServicePage.saveBtn;
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
    editServicePage.get(stackId, serviceId, true);
    
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
  
  it('should allow the user to abort the edit process', function() {
    // Click the cancel button
    var cancelBtn = editServicePage.cancelBtn;
    helpers.scrollIntoView(cancelBtn);
    cancelBtn.click();
    
    // Ensure that we are brought back to the dashboard page
    dashboardPage.verify();
  });
  
  it('should allow the user to save after entering all required fields', function() {
    //console.log("Adding service " + serviceKey + " to "+ stackId);
    
    // Click the save button
    var saveBtn = editServicePage.saveBtn;
    expectBtn(true);
    helpers.scrollIntoView(saveBtn);
    saveBtn.click();
    
    // Ensure that we are brought back to the catalog page
    dashboardPage.verify();
  });
  
  describe('Environment Tab', function() {
    beforeEach(function() {
      editServicePage.environmentTab.click();
      
      // Verify initial page state
      expect(editServicePage.cfgAddBtn.isPresent()).toBe(true);
      expect(editServicePage.cfgAddBtn.isDisplayed()).toBe(true);
      expect(editServicePage.cfgAddBtn.isEnabled()).toBe(false);
      
      expect(editServicePage.newCfgNameInvalidText.isPresent()).toBe(true);
      expect(editServicePage.newCfgNameInvalidText.getText()).toContain(TEST_INVALID_CFG_MSG_NAME_REQUIRED);
      
      expect(editServicePage.newCfgValueInvalidText.isPresent()).toBe(true);
      expect(editServicePage.newCfgValueInvalidText.getText()).toContain(TEST_INVALID_CFG_MSG_VALUE_REQUIRED);
    });
    
    it('should allow the user to add custom environment variables', function() {
      // Verify initial page state
      expect(editServicePage.cfgAddBtn.isEnabled()).toBe(false);
      // Enter a variable name
      editServicePage.newCfgNameInput.sendKeys(TEST_CFG_NAME);
      expect(editServicePage.newCfgNameInvalidText.isPresent()).toBe(false);
      
      // Enter a variable value
      editServicePage.newCfgValueInput.sendKeys(TEST_CFG_VALUE);
      expect(editServicePage.newCfgValueInvalidText.isPresent()).toBe(false);
      
      // Ensure that we can now add the config
      expect(editServicePage.newCfgValidText.getText()).toContain(TEST_VALID_CFG_MSG);
      expect(editServicePage.cfgAddBtn.isEnabled()).toBe(true);
      editServicePage.cfgAddBtn.click();
    });
    
    describe('With Configs', function() {
      beforeEach(function() {
        editServicePage.addConfig(TEST_CFG_NAME, TEST_CFG_VALUE);
      });
      
      it('should prevent the user from adding duplicate variables', function() {
        // Verify initial page state
        expect(editServicePage.newCfgNameInvalidText.getText()).toContain(TEST_INVALID_CFG_MSG_NAME_REQUIRED);
        expect(editServicePage.newCfgValueInvalidText.getText()).toContain(TEST_INVALID_CFG_MSG_VALUE_REQUIRED);
                
        // Enter a variable value
        editServicePage.newCfgValueInput.sendKeys(TEST_CFG_VALUE);
        expect(editServicePage.newCfgValueInvalidText.isPresent()).toBe(false);
        
        // Enter a variable name
        editServicePage.newCfgNameInput.sendKeys(TEST_CFG_NAME);
        expect(editServicePage.newCfgNameInvalidText.isPresent()).toBe(true);
        expect(editServicePage.newCfgNameInvalidText.getText()).toContain(TEST_INVALID_CFG_MSG_NAME_UNIQUE);

        // Ensure that we cannot add the config
        expect(editServicePage.newCfgValidText.isPresent()).toBe(false);
        expect(editServicePage.cfgAddBtn.isEnabled()).toBe(false);
      });
      
      it('should allow the user to remove custom environment variables', function() {
        editServicePage.configs.then(function(configs) {
          for(let i = 0; i < configs.length; i++) {
            let cfg = configs[i];
            var removeBtn = editServicePage.cfgRemoveBtn(cfg);
            //expect(editServicePage.cfgRemoveBtn(cfg).isPresent()).toBe(true);
            //expect(editServicePage.cfgRemoveBtn(cfg).isDisplayed()).toBe(true);
            //expect(editServicePage.cfgRemoveBtn(cfg).isEnabled()).toBe(true);
            clickBtn(removeBtn);
          }
        });
      });
    });
  });
  
  describe('Data Tab', function() {
    beforeEach(function() {
      editServicePage.dataTab.click();
      expect(editServicePage.volumeAddBtn.isPresent()).toBe(true);
      expect(editServicePage.volumeAddBtn.isDisplayed()).toBe(true);
      expect(editServicePage.volumeAddBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to add custom volume mounts', function() {
      // Verify initial page state
      expect(editServicePage.volumeAddBtn.isEnabled()).toBe(false);
      
      // Enter a mount source 
      editServicePage.newVolumeFrom.sendKeys(TEST_VOLUME_FROM);
      
      // Enter a mount destnation
      editServicePage.newVolumeTo.sendKeys(TEST_VOLUME_TO);
      
      // Ensure that we can now add the volume
      expect(editServicePage.volumeAddBtn.isEnabled()).toBe(true);
      editServicePage.volumeAddBtn.click();
    });
    
    describe('With Volumes', function() {
      beforeEach(function() {
        editServicePage.addVolume(TEST_VOLUME_FROM, TEST_VOLUME_TO);
      });
      
      it('should prevent the user from adding duplicate volumes', function() {
        // Enter a mount source 
        editServicePage.newVolumeFrom.sendKeys(TEST_VOLUME_FROM);
        
        // Enter a mount destnation
        editServicePage.newVolumeTo.sendKeys(TEST_VOLUME_TO);
        
        // Ensure that we cannot add the duplicate volume
        expect(editServicePage.volumeAddBtn.isEnabled()).toBe(false);
      });
      
      it('should allow the user to remove custom volumes', function() {
        editServicePage.volumes.then(function(volumes) {
          for(let i = 0; i < volumes.length; i++) {
            let vol = volumes[i];
            //expect(editServicePage.volumeRemoveBtn(vol).isPresent()).toBe(true);
            //expect(editServicePage.volumeRemoveBtn(vol).isDisplayed()).toBe(true);
            //expect(editServicePage.volumeRemoveBtn(vol).isEnabled()).toBe(true);
            var removeBtn = editServicePage.volumeRemoveBtn(vol);
            clickBtn(removeBtn);
          }
        });
      });
    });
  });
  
  describe('Docker Tab', function() {
    beforeEach(function() {
      editServicePage.dockerTab.click();
    });
    
    it('should allow the user to change the docker tag of the service', function() {
      expect(editServicePage.dockerImageTagSelect.isPresent()).toBe(true);
      expect(editServicePage.dockerImageTagSelect.isDisplayed()).toBe(true);
    });
  });
});