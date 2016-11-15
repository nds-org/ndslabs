/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var CatalogPage = require('./catalog.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "spec name" in title?
// TODO: How to handle "id" in url?
var PAGE_TITLE = /(Add|Edit) Application\:?.*/;
var PAGE_ROUTE = /https\:\/\/.+\/\#\/store\/(add|edit)\/?.*/;

var AddSpecPage = function() {
  // Details Tab (Left side - General)
  this.detailsTab = element(by.id('detailsTab'));
  this.keyField = element(by.id('keyField'));
  this.nameField = element(by.id('nameField'));
  this.logoField = element(by.id('logoField'));
  this.infoLinkHelperLink = element(by.id('infoLinkHelperLink'));
  this.infoLinkField = element(by.id('infoLinkField'));
  this.maintainerField = element(by.id('maintainerField'));
  this.descriptionField = element(by.id('descriptionField'));
  this.externalAccessBtn = element(by.id('externalAccessBtn'));
  this.internalAccessBtn = element(by.id('internalAccessBtn'));
  this.noAccessBtn = element(by.id('noAccessBtn'));
  this.newTagSelect = element(by.id('newTagSelect'));
  this.addTagBtn = element(by.id('addTagBtn'));
  this.searchTags = element.all(by.repeater('tagId in spec.tags'));
  this.searchTagText = function(tag) {  return tag.element(by.id('searchTagText')); };
  this.removeTagBtn = function(tag) {  return tag.element(by.id('removeTagBtn')); };
  
  // Details Tab (Right side - Docker)
  this.readinessProbeTypeSelect = element(by.id('readinessProbeTypeSelect'));
  this.readinessProbePath = element(by.id('readinessProbePath'));
  this.readinessProbeHttpsCheckbox = element(by.id('readinessProbeHttpsCheckbox'));
  this.readinessProbePort = element(by.id('readinessProbePort'));
  this.readinessProbeDelay = element(by.id('readinessProbeDelay'));
  this.readinessProbeTimeout = element(by.id('readinessProbeTimeout'));
  this.cmdField = element(by.id('cmdField'));
  this.argsFields = element(by.id('argsFields'));
  this.registryField = element(by.id('registryField'));
  this.imageNameField = element(by.id('imageNameField'));
  this.newDockerTagNameField = element(by.id('newDockerTagNameField'));
  this.dockerTags = element.all(by.repeater('tag in spec.image.tags'));
  this.dockerTagText = function(tag) {  return tag.element(by.id('dockerTagText')); };
  this.removeDockerTagBtn = function(tag) {  return tag.element(by.id('removeDockerTagBtn')); };
  
  // Dependencies Tab
  this.dependenciesTab = element(by.id('dependenciesTab'));
  this.newDepSelect = element(by.id('newDepSelect'));
  this.newDepRequiredCheckbox = element(by.id('newDepRequiredCheckbox'));
  this.addNewDepBtn = element(by.id('addNewDepBtn'));
  this.dependencies = element.all(by.repeater('dep in spec.depends'));
  this.depLabelText = function(dep) {  return dep.element(by.id('depLabelText')); };
  this.depRequiredCheckbox = function(dep) {  return dep.element(by.id('depRequiredCheckbox')); };
  this.removeDepBtn = function(dep) {  return dep.element(by.id('removeDepBtn')); };
  
  // Environment Tab
  this.environmentTab = element(by.id('environmentTab'));
  this.newCfgNameField = element(by.id('newCfgNameField'));
  this.newCfgLblField = element(by.id('newCfgLblField'));
  this.newCfgSetToSelect = element(by.id('newCfgSetToSelect'));
  this.newCfgTypeSelect = element(by.id('newCfgTypeSelect'));
  this.newCfgUseFromSelect = element(by.id('newCfgUseFromSelect'));
  this.newCfgValueField = element(by.id('newCfgValueField'));
  this.addCfgBtn = element(by.id('addCfgBtn'));
  this.configs = element(by.repeater('cfg in spec.config'));
  this.cfgNameText = function(cfg) {  return cfg.element(by.id('cfgNameText')); };
  this.cfgLabelText = function(cfg) {  return cfg.element(by.id('cfgLabelText')); };
  this.cfgTypeText = function(cfg) {  return cfg.element(by.id('cfgTypeText')); };
  this.cfgCanOverrideCheckbox = function(cfg) {  return cfg.element(by.id('cfgCanOverrideCheckbox')); };
  this.cfgIsPasswordCheckbox = function(cfg) {  return cfg.element(by.id('cfgIsPasswordCheckbox')); };
  this.removeCfgBtn = function(cfg) {  return cfg.element(by.id('removeCfgBtn')); };
  
  // Data Tab
  this.dataTab = element(by.id('dataTab'));
  this.newVolumePathField = element(by.id('volPathField'));
  this.addVolumeBtn = element(by.id('addVolumeBtn'));
  this.volumes = element.all(by.repeater("vol in spec.volumeMounts | orderBy:'mountPath'"));
  this.mountPathText = function(volume) {  return volume.element(by.id('mountPathText')); };
  this.removeVolumeBtn = function(volume) {  return volume.element(by.id('removeVolumeBtn')); };
  
  // Ports Tab
  this.portsTab = element(by.id('portsTab'));
  this.newPortHttpBtn = element(by.id('newPortHttpBtn'));
  this.newPortTcpBtn = element(by.id('newPortTcpBtn'));
  this.newPortNumberField = element(by.id('portNumberField'));
  this.newPortPathField = element(by.id('portPathField'));
  this.addPortBtn = element(by.id('addPortBtn'));
  this.ports = element.all(by.repeater('port in spec.ports'));
  this.portHttpBtn = function(port) {  return port.element(by.id('portHttpBtn')); };
  this.portTcpBtn = function(port) {  return port.element(by.id('portTcpBtn')); };
  this.portPortField = function(port, index) {  return port.element(by.id('portPortField' + index)); };
  this.portPathField = function(port, index) {  return port.element(by.id('portPathField' + index)); };
  this.removePortBtn = function(port) {  return port.element(by.id('removePortBtn')); };
  
  // Resource Limits Tab
  this.resourceLimitsTab = element(by.id('resourceLimitsTab'));
  this.limitCpuDefaultField = element(by.id('limitCpuDefaultField'));
  this.limitCpuMaxField = element(by.id('limitCpuMaxField'));
  this.limitMemDefaultField = element(by.id('limitMemDefaultField'));
  this.limitMemMaxField = element(by.id('limitMemMaxField'));
  
  // Development Tab
  this.developmentEnvironmentTab = element(by.id('developmentEnvironmentTab'));
  this.developerEnvironmentSelect = element(by.id('developerEnvironmentSelect'));
  this.repoTypeSelect = element(by.id('repoTypeSelect'));
  this.repoUrlField = element(by.id('repoUrlField'));
  this.addRepoBtn = element(by.id('addRepoBtn'));
  this.sourceRepos = element.all(by.repeater('repo in spec.repositories'));
  this.repoTypeText = function(repo) {  return repo.element(by.id('repoTypeText')); };
  this.repoUrlText = function(repo) {  return repo.element(by.id('repoUrlText')); };
  this.removeRepoBtn = function(repo) {  return repo.element(by.id('removeRepoBtn')); };
  
  // Save / Cancel buttons
  this.saveBtn = element(by.id('saveBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
};

// Navigate to the Add Spec view
AddSpecPage.prototype.get = function(loggedIn) {
  var catalogPage = new CatalogPage();
  catalogPage.get(loggedIn);
  catalogPage.createButton.click();
	
  this.verify();
};

// Ensure that we are on the correct page
AddSpecPage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};

/**
 * Insert public Getter functions here for user interactions
 */

module.exports = AddSpecPage;