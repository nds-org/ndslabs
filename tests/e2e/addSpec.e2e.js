/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');
var AddEditSpecPage = require('./pages/addEditSpec.page.js');

var TEST_CREATED_SPEC_KEY = 'createdspec';
var TEST_CREATED_SPEC_NAME = 'New Application';
var TEST_CREATED_SPEC_IMAGE_NAME = 'ndslabs/cowsay-php';

var TEST_DOCKER_IMAGE_TAG = 'latest';

var TEST_SEARCH_TAG_NAME = 'Archive';

var TEST_DEPENDENCY_KEY = 'rabbitmq';

var TEST_CFG_NAME = 'CONFIG_NAME';
var TEST_CFG_LABEL = 'Config Label';
var TEST_CFG_VALUE = 'Config Value';

var TEST_VOLUME_PATH = '/appdata';

var TEST_PORT_TYPE_HTTP = 'http';
var TEST_PORT_TYPE_TCP = 'tcp';
var TEST_PORT_NUMBER = 80;
var TEST_PORT_PATH = '/some/path';

var TEST_REPO_TYPE = 'git';
var TEST_REPO_URL = 'https://github.com/nds-org/ndslabs';

var EC = protractor.ExpectedConditions;

// addSpec.e2e.js
describe('Labs Workbench Add Application Spec View', function() {
  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var addSpecPage = new AddEditSpecPage();
  
  beforeAll(function() { 
    helpers.beforeAll();
    dashboardPage.get();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    addSpecPage.get({ loggedIn: true });
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
  
  // FIXME: Test browser should scroll to card
  // FIXME: Move this to helpers
  var expectSpec = function(specKey, viewAsTable) {
    // Wait for new card to appear
    return browser.wait(function() {
      return helpers.selectByModel(viewAsTable ? catalogPage.table : catalogPage.cards, "spec.key", function(key) { 
        return key === specKey; // How to know we've found our match
      }, function(match) { 
        return match;
      });
    }, 5000);
  };
  
  // FIXME: Move this to helpers
  var expectBtn = function(enabled) {
    var saveBtn = addSpecPage.saveBtn;
    helpers.scrollIntoView(saveBtn);
    expect(saveBtn.isDisplayed()).toBe(true);
    expect(saveBtn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
  };
  
  it('should allow the user to abort the creation process', function() {
    // Click the cancel button
    var cancelBtn = addSpecPage.cancelBtn;
    helpers.scrollIntoView(cancelBtn);
    cancelBtn.click();
    
    // Ensure that we are brought back to the catalog page
    catalogPage.verify();
  });
  
  it('should allow the user to save after entering all required fields', function() {
    expectBtn(false);
    
    // Enter all required fields: key, name, image name
    var keyField = addSpecPage.keyField;
    var nameField =  addSpecPage.nameField;
    var imageNameField = addSpecPage.imageNameField;
    var saveBtn = addSpecPage.saveBtn;
    
    // Enter an application key (save button should remain disabled)
    helpers.scrollIntoView(keyField);
    keyField.sendKeys(TEST_CREATED_SPEC_KEY);
    expectBtn(false);
    
    // Enter an application display name (save button should remain disabled)
    helpers.scrollIntoView(nameField);
    nameField.sendKeys(TEST_CREATED_SPEC_NAME);
    expectBtn(false);
    
    // Enter an image name (this should enable the save button)
    helpers.scrollIntoView(imageNameField);
    imageNameField.sendKeys(TEST_CREATED_SPEC_IMAGE_NAME);
    
    // You should now be able to click the save button
    expectBtn(true);
    saveBtn.click();
    
    // Ensure that we are brought back to the catalog page
    catalogPage.verify();
    
    // Verify that our new spec was added
    expectSpec(TEST_CREATED_SPEC_KEY).then(function(application) {
      helpers.scrollIntoView(application);
    
      // Delete the new spec to reset test state
      catalogPage.deleteSpec(TEST_CREATED_SPEC_KEY);
    });
  });
  
  describe('Details Tab', function() {
    beforeEach(function() {
      addSpecPage.detailsTab.click();
      expect(addSpecPage.addSearchTagBtn.isEnabled()).toBe(false);
      expect(addSpecPage.addDockerTagBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to add search tags', function() {
      
    });
    
    it('should allow the user to add docker image tags', function() {
      // Enter the port number
      addSpecPage.newDockerTagNameField.sendKeys(TEST_DOCKER_IMAGE_TAG);
      
      // Click the Add button
      var addBtn = addSpecPage.addDockerTagBtn;
      expect(addBtn.isEnabled()).toBe(true);
      addBtn.click();
    });
    
    describe('With Search Tags', function() {
      beforeAll(function() {
        //addSpecPage.addSearchTag(TEST_SEARCH_TAG_NAME);
      });
      
      it('should allow the user to remove search tags', function() {
        
      });
    });
    
    describe('With Docker Tags', function() {
      beforeAll(function() {
        //addSpecPage.addDockerTag('testing');
      });
      
      it('should allow the user to remove Docker tags', function() {
        
      });
    });
  });
  
  describe('Dependencies Tab', function() {
    beforeEach(function() {
      addSpecPage.dependenciesTab.click();
      expect(addSpecPage.addNewDepBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to add service dependencies', function() {
      
    });
    
    describe('With Dependencies', function() {
      beforeAll(function() {
        //addSpecPage.addDependency(TEST_DEPENDENCY_KEY);
      });
      
      it('should allow the user to remove service dependencies', function() {
        
      });
    });
  });
  
  describe('Environment Tab', function() {
    beforeEach(function() {
      addSpecPage.environmentTab.click();
      expect(addSpecPage.addCfgBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to add environment variables', function() {
      
    });
    
    describe('With Configs', function() {
      beforeAll(function() {
        addSpecPage.addConfig('explicit', {
          name: TEST_CFG_NAME,
          label: TEST_CFG_LABEL,
          value: TEST_CFG_VALUE
        });
      });
      
      it('should prevent adding duplicate environment variables', function() {
        
      });
      
      it('should allow the user to remove environment variables', function() {
        
      });
    });
  });
  
  describe('Data Tab', function() {
    beforeEach(function() {
      addSpecPage.dataTab.click();
      expect(addSpecPage.volumeAddBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to add volume mounts', function() {
      // Enter new mount path
      addSpecPage.newVolumePathField.sendKeys(TEST_VOLUME_PATH);
      
      // Click the Add button
      var addBtn = addSpecPage.volumeAddBtn;
      expect(addBtn.isEnabled()).toBe(true);
      addBtn.click();
    });
    
    describe('With Volumes', function() {
      beforeAll(function() {
        addSpecPage.addVolume(TEST_VOLUME_PATH);
      });
      
      it('should allow the user to remove volume mounts', function() {
        
      });
    });
  });
  
  describe('Ports Tab', function() {
    beforeEach(function() {
      addSpecPage.portsTab.click();
      expect(addSpecPage.addPortBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to add ports', function() {
      
    });
    
    describe('With Ports', function() {
      beforeAll(function() {
        addSpecPage.addPort(TEST_PORT_NUMBER, TEST_PORT_PATH);
      });
      
      it('should allow the user to remove ports', function() {
        
      });
    });
  });
  
  describe('Resource Limits Tab', function() {
    beforeEach(function() {
      addSpecPage.resourceLimitsTab.click();
    });
  });
  
  describe('Development Tab', function() {
    beforeEach(function() {
      addSpecPage.developmentTab.click();
      expect(addSpecPage.addRepoBtn.isEnabled()).toBe(false);
    });
    
    it('should allow the user to select a development environment', function() {
      // NOOP
    });
    
    it('should allow the user to source repos', function() {
      
    });
    
    describe('With Source Repos', function() {
      beforeAll(function() {
        addSpecPage.addSrcRepo(TEST_REPO_TYPE, TEST_REPO_URL);
      });
      
      it('should allow the user to remove ports', function() {
        
      });
    });
  });
});