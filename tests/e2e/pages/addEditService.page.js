/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

// Load other modules
var shared = require('./shared.page.js');

var DashboardPage = require('./dashboard.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "service name" in title?
// TODO: How to handle "stackServiceId" in url?
var PAGE_TITLE = /Add Service/;
var PAGE_ROUTE = /https\:\/\/.+\/\#\/home\/.+\/add\/.+/;

var AddServicePage = function() {
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
  
  this.volumeBadge = element(by.id('volumeBadge'));
  this.volumeFromInput = element(by.id('volumeFromInput'));
  this.volumeToInput = element(by.id('volumeToInput'));
  this.volumeRemoveBtn = element(by.id('volumeRemoveBtn'));
  this.newVolumeFrom = element(by.id('newVolumeFrom'));
  this.newVolumeTo = element(by.id('newVolumeTo'));
  this.volumeAddBtn = element(by.id('volumeAddBtn'));
  
  this.dockerImageRegistryText = element(by.id('dockerImageRegistryText'));
  this.dockerImageNameText = element(by.id('dockerImageNameText'));
  this.dockerImageTagSelect = element(by.id('dockerImageTagSelect'));
  
  this.saveBtn = element(by.id('saveBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
};

// Navigate to the App Service view
AddServicePage.prototype.get = function(loggedIn) {
  var dashboardPage = new DashboardPage();
  dashboardPage.get(loggedIn);
	
  this.verify();
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