/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var CatalogPage = require('./catalog.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

// TODO: How to handle "edit" case?
// TODO: How to handle "spec name" in title?
// TODO: How to handle "id" in url?
var PAGE_TITLE = /(Add|Edit) Application\:?.*/;
var PAGE_ROUTE = /https?\:\/\/.+\/\#\/store\/(add|edit)\/?.*/;

var EC = protractor.ExpectedConditions;

var AddSpecPage = function() {
  "use strict";

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
  this.addSearchTagBtn = element(by.id('addTagBtn'));
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
  this.addDockerTagBtn = element(by.id('addDockerTagBtn'));
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

// Navigate to the Add/Edit Spec view
AddSpecPage.prototype.get = function(options) {
  "use strict";

  var catalogPage = new CatalogPage();
  var self = this;
  catalogPage.get(options.loggedIn);
  
  var promise;
  if (options.editId) {
    promise = catalogPage.editSpec(options.editId);
  } else {
    promise = catalogPage.createBtn.click();
  }
	
	return promise.then(function() {
    self.verify();
  });
};

// Ensure that we are on the correct page
AddSpecPage.prototype.verify = function() { 
  "use strict";

  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};

AddSpecPage.prototype.addConfig = function(type, fields) {
  "use strict";

  /*
    Populate inputs and click the button:
    
    this.newCfgTypeSelect = element(by.id('newCfgTypeSelect'));
    this.newCfgSetToSelect = element(by.id('newCfgSetToSelect'));
    this.newCfgUseFromSelect = element(by.id('newCfgUseFromSelect'));
  */
  
  this.newCfgNameField.sendKeys(fields.name);
  this.newCfgLblField.sendKeys(fields.label);
  
  if (type === 'useFrom') {
    // TODO: useFrom dropdown
  } else if (type === 'setTo') {
    // TODO: setTo dropdown
    this.newCfgValueField.sendKeys(fields);
  } else {
    this.newCfgValueField.sendKeys(fields);
  }
  
  // Click the Add button
  this.addCfgBtn.click();
};

AddSpecPage.prototype.addVolume = function(path) {
  "use strict";

  // Clear initial value from the field
  this.newVolumePathField.clear();
  
  // Enter new mount path
  this.newVolumePathField.sendKeys(path);
  
  // Click the Add button
  this.addVolumeBtn.click();
};

AddSpecPage.prototype.addDependency = function(specKey, required) {
  "use strict";

  /*
    Populate inputs and click the button:
    
    this.newDepSelect = element(by.id('newDepSelect'));
  */
  
  helpers.selectDropdownbyNum(this.newDepSelect, 0);
  
  // Check the box if this dependency is required
  if (required) {
    this.newDepRequiredCheckbox.click();
  }
  
  this.addNewDepBtn.click();
};

AddSpecPage.prototype.addPort = function(number, path) {
  "use strict";

  // Clear initial value from the field
  this.newPortNumberField.clear();
  
  // Enter the port number
  this.newPortNumberField.sendKeys(number);
    
  if (path) {
    // Path given => HTTP port
    this.newPortHttpBtn.click();
    this.newPortPathField.sendKeys(path);
  } else {
    // No path => TCP port
    this.newPortTcpBtn.click();
  }
  
  // Click the Add button
  this.addPortBtn.click();
};

AddSpecPage.prototype.addDockerTag = function(tagName) {
  "use strict";

  // Enter the port number
  this.newDockerTagNameField.sendKeys(tagName);
  
  // Click the Add button
  this.addDockerTagBtn.click();
};

AddSpecPage.prototype.addSrcRepo = function(url, type) {
  "use strict";

  /*
    Populate inputs and click the button:
  
    this.repoTypeSelect = element(by.id('repoTypeSelect'));
  */
  
  // Expand dropdown menu
  this.repoTypeSelect.click();
  
  // TODO: parameterize selected index
  // FIXME: For some reason, this dropdown start at index '1'
  helpers.selectDropdownbyNum(this.repoTypeSelect, 1);
  
  // Enter the repository url
  this.repoUrlField.sendKeys(url);
  
  // Click the Add button
  this.addRepoBtn.click();
};

AddSpecPage.prototype.addSearchTag = function(tagName) {
  "use strict";

  /*
    Populate inputs and click the button:
  
    this.newTagSelect = element(by.id('newTagSelect'));
  */
  
  // Expand dropdown menu
  this.newTagSelect.click();
  
  // TODO: parameterize selected index
  helpers.selectDropdownbyNum(this.newTagSelect, 0);
  
  // Click the Add button
  this.addSearchTagBtn.click();
};

/**
 * Insert public Getter functions here for user interactions
 */

module.exports = AddSpecPage;
