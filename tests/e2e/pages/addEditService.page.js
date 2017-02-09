/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var DashboardPage = require('./dashboard.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "service name" in title?
// TODO: How to handle "stackServiceId" in url?
var PAGE_TITLE = /(Add|Edit) Application Service(\: .*)?/;
var PAGE_ROUTE = /https?\:\/\/.+\/\#\/home\/.+\/(add|edit)\/?.*/;

var EC = protractor.ExpectedConditions;

var AddServicePage = function() {
  "use strict";

  this.environmentTab = element(by.id('environmentTab'));
  this.configs = element.all(by.repeater("cfg in configs | orderBy:['spec.canOverride', 'spec.isPassword'] track by cfg.name"));
  this.cfgBadge = element(by.id('cfgBadge'));
  this.cfgNameInput = function(cfg) {  return cfg.element(by.id('cfgName')); };
  this.cfgValueInput = function(cfg) {  return cfg.element(by.id('cfgValue')); };
  this.cfgPasswordInput = function(cfg) {  return cfg.element(by.id('cfgPassword')); };
  this.cfgPasswordStrength = function(cfg) {  return cfg.element(by.id('cfgPasswordStrength')); };
  this.cfgDefaultBtn = function(cfg) {  return cfg.element(by.id('cfgDefaultBtn')); };
  this.cfgRemoveBtn = function(cfg) {  return cfg.element(by.id('cfgRemoveBtn')); };
  this.newCfgNameInput = element(by.id('newCfgName'));
  this.newCfgValueType = element(by.id('newCfgValueType'));
  this.newCfgValueInput = element(by.id('newCfgValue'));
  this.newCfgNameInvalidText = element(by.id('newCfgNameInvalidText'));
  this.newCfgValueInvalidText = element(by.id('newCfgValueInvalidText'));
  this.newCfgValidText = element(by.id('newCfgValidText'));
  this.cfgAddBtn = element(by.id('cfgAddBtn'));
  
  this.dataTab = element(by.id('dataTab'));
  this.volumes = element.all(by.repeater("volume in volumes | orderBy:'canEdit':true"));
  this.volumeBadge = element(by.id('volumeBadge'));
  this.volumeFromInput = function(vol) {  return vol.element(by.id('volumeFromInput')); };
  this.volumeToInput = function(vol) {  return vol.element(by.id('volumeToInput')); };
  this.volumeRemoveBtn = function(vol) {  return vol.element(by.id('volumeRemoveBtn')); };
  this.newVolumeFrom = element(by.id('newVolumeFrom'));
  this.newVolumeTo = element(by.id('newVolumeTo'));
  this.volumeAddBtn = element(by.id('volumeAddBtn'));
  
  this.dockerTab = element(by.id('dockerTab'));
  this.dockerTags = element.all(by.repeater('tag in spec.image.tags track by tag'));
  this.dockerImageRegistryText = element(by.id('dockerImageRegistryText'));
  this.dockerImageNameText = element(by.id('dockerImageNameText'));
  this.dockerImageTagSelect = element(by.id('dockerImageTagSelect'));
  
  this.saveBtn = element(by.id('saveBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
};

// FIXME: Feature envy
AddServicePage.prototype.getAsEdit = function(application, serviceId) {
  "use strict";

  var dashboardPage = new DashboardPage();
  var self = this;
  
  application.click();
  
  return helpers.selectByModel(dashboardPage.services(application), "svc.id", function(id) {
    return id === serviceId;
  }, function(svcMatch) {
    // Click the "Edit" button next to the first service
    dashboardPage.editServiceBtn(svcMatch).click();
    self.verify();
    
    return application;
  });
};

// FIXME: Feature envy
AddServicePage.prototype.getAsAdd = function(application, serviceToAdd) {
  "use strict";

  var dashboardPage = new DashboardPage();
  var self = this;
  
  application.click();

  // Select the first optional service and click the "Add Service" button
  return dashboardPage.selectServiceToAdd(application, serviceToAdd).then(function() {
    var addServiceBtn = dashboardPage.addServiceBtn(application);
    browser.wait(EC.elementToBeClickable(addServiceBtn), 5000);
    addServiceBtn.click();
    self.verify();
    
    return application;
  });
};

// Navigate to the Add Service view
AddServicePage.prototype.get = function(stackId, serviceId, loggedIn) {
  "use strict";

  var dashboardPage = new DashboardPage();
  var self = this;
  
  var editMode = (typeof serviceId === 'string');
  
  dashboardPage.get(loggedIn);
  
  return helpers.selectByModel(dashboardPage.applications, "stack.id", function(id) {
    return id === stackId;
  }, function(application) {
    if (editMode) {
      return self.getAsEdit(application, serviceId);
    } else {
      return self.getAsAdd(application, serviceId);
    }
  });
};

// Ensure that we are on the correct page
AddServicePage.prototype.verify = function() {
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};

AddServicePage.prototype.addConfig = function(name, value) {
  "use strict";

  // Enter a variable name
  this.newCfgNameInput.sendKeys(name);
  
  // Enter a variable value
  this.newCfgValueInput.sendKeys(value);
  
  // Click the Add button
  this.cfgAddBtn.click();
};

AddServicePage.prototype.addVolume = function(from, to) {
  "use strict";

  // Enter a mount source
  this.newVolumeFrom.sendKeys(from);
  
  // Enter a mount destination
  this.newVolumeTo.sendKeys(to);
  
  // Click the Add button
  this.volumeAddBtn.click();
};


/**
 * Insert public functions here for user actions
 */

module.exports = AddServicePage;
