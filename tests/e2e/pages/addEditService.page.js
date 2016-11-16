/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var DashboardPage = require('./dashboard.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "service name" in title?
// TODO: How to handle "stackServiceId" in url?
var PAGE_TITLE = /(Add|Edit) Application Service(\: .*)?/;
var PAGE_ROUTE = /https\:\/\/.+\/\#\/home\/.+\/(add|edit)\/?.*/;

var EC = protractor.ExpectedConditions;

var AddServicePage = function() {
  this.configs = element.all(by.repeater("cfg in configs | orderBy:['spec.canOverride', 'spec.isPassword'] track by cfg.name"));
  this.cfgBadge = element(by.id('cfgBadge'));
  this.cfgNameInput = element(by.id('cfgName'));
  this.newCfgValueType = element(by.id('newCfgValueType'));
  this.cfgValueInput = element(by.id('cfgValue'));
  this.cfgPasswordInput = element(by.id('cfgPassword'));
  this.cfgPasswordStrength = element(by.id('cfgPasswordStrength'));
  this.cfgDefaultBtn = element(by.id('cfgDefaultBtn'));
  this.cfgRemoveBtn = element(by.id('cfgRemoveBtn'));
  this.newCfgNameInput = element(by.id('newCfgName'));
  this.newCfgValueInput = element(by.id('newCfgValue'));
  this.newCfgValidationText = element(by.id('newCfgValidationText'));
  this.cfgAddBtn = element(by.id('cfgAddBtn'));
  
  this.volumes = element.all(by.repeater("volume in volumes | orderBy:'canEdit':true"));
  this.volumeBadge = element(by.id('volumeBadge'));
  this.volumeFromInput = element(by.id('volumeFromInput'));
  this.volumeToInput = element(by.id('volumeToInput'));
  this.volumeRemoveBtn = element(by.id('volumeRemoveBtn'));
  this.newVolumeFrom = element(by.id('newVolumeFrom'));
  this.newVolumeTo = element(by.id('newVolumeTo'));
  this.volumeAddBtn = element(by.id('volumeAddBtn'));
  
  this.dockerTags = element.all(by.repeater('tag in spec.image.tags track by tag'));
  this.dockerImageRegistryText = element(by.id('dockerImageRegistryText'));
  this.dockerImageNameText = element(by.id('dockerImageNameText'));
  this.dockerImageTagSelect = element(by.id('dockerImageTagSelect'));
  
  this.saveBtn = element(by.id('saveBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
};

// FIXME: Code envy
AddServicePage.prototype.getAsEdit = function(application, serviceId) {
  var dashboardPage = new DashboardPage();
  var self = this;
  
  application.click();
  
  return helpers.selectByModel(dashboardPage.services(application), "svc.id", function(id) {
    return id === serviceId;
  }, function(svcMatch) {
    // Click the "Edit" button next to the first service
    dashboardPage.editServiceBtn(svcMatch).click();
    self.verify();
  });
};

// FIXME: Code envy
AddServicePage.prototype.getAsAdd = function(application, serviceToAdd) {
  var dashboardPage = new DashboardPage();
  var self = this;
  
  application.click();

  // Select the first optional service and click the "Add Service" button
  return dashboardPage.selectServiceToAdd(application, serviceToAdd).then(function() {
    var addServiceBtn = dashboardPage.addServiceBtn(application);
    browser.wait(EC.elementToBeClickable(addServiceBtn), 5000);
    addServiceBtn.click();
    self.verify();
  });
};

// Navigate to the Add Service view
AddServicePage.prototype.get = function(stackId, serviceId, loggedIn) {
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
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};


/**
 * Insert public functions here for user actions
 */

module.exports = AddServicePage;