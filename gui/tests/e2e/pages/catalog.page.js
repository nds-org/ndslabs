/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var Navbar = require('./navbar.page.js');
var DashboardPage = require('./dashboard.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Labs Workbench Catalog';
var PAGE_ROUTE = /https\:\/\/.+\/\#\/store/;

var EC = protractor.ExpectedConditions;

var CatalogPage = function() {
  // Search Header
  this.searchFilter = element(by.id('filterTagsInput'));
  this.removeTagBtn = element(by.css('[ng-click="$removeTag()"]'));
  this.toggleCardsBtn = element(by.id('toggleCardsBtn'));
  this.viewAsIcon = element(by.id('viewAsIcon'));
  this.importButton = element(by.id('importApplicationBtn'));
  this.createButton = element(by.id('createApplicationBtn'));
  this.autocompleteSuggestions = element.all(by.repeater('item in suggestionList.items track by track(item)'));
  
  // Mutually exclusive app spec list (view as)
  this.table = element.all(by.repeater("spec in specs | display | showTags:tags.selected | orderBy:'label' track by spec.key"));
  this.cards = element.all(by.repeater('spec in set'));
  
  // Modals
  this.exportSpecModal = element(by.id('exportSpecModal'));
  this.cloneSpecModal = element(by.id('cloneSpecModal'));
  this.importSpecModal = element(by.id('importSpecModal'));
  this.deleteSpecModal = element(by.id('deleteSpecModal'));
  
  // Shared Modal Stuff
  this.confirmBtn = element(by.id('confirmBtn'));
  this.cancelBtn = element(by.id('cancelBtn'));
  this.closeBtn = element(by.id('closeBtn'));
  
  // Other Modal Stuff
  this.cloneKeyInput = element(by.id('cloneKeyInput'));            // Clone spec modal
  this.editBtn = element(by.id('editBtn'));                        // Export spec modal
  this.copyToClipboardModalBtn = element(by.id('copyToClipboardModalBtn'));                        // Export spec modal
    
  // Pass in a card or table row to get its inner buttons
  this.logoLink = function(cardOrRow) {  return cardOrRow.element(by.id('logoLink')); };
  this.addBtn = function(cardOrRow) {  return cardOrRow.element(by.id('addBtn')); };
  this.viewBtn = function(cardOrRow) {  return cardOrRow.element(by.id('viewBtn')); };
  this.helpLink = function(cardOrRow) {  return cardOrRow.element(by.id('helpLink')); };
  this.moreActionsDropdown = function(cardOrRow) {  return cardOrRow.element(by.id('moreActionsDropdown')); };
  this.cloneBtn = function(cardOrRow) {  return cardOrRow.element(by.id('cloneBtn')); };
  this.copyToClipboardBtn = function(cardOrRow) {  return cardOrRow.element(by.id('copyToClipboardBtn')); };
  this.viewJsonBtn = function(cardOrRow) {  return cardOrRow.element(by.id('viewJsonBtn')); };
  this.viewDocsBtn = function(cardOrRow) {  return cardOrRow.element(by.id('viewDocsBtn')); };

  // User-applications only
  this.editBtn = function(cardOrRow) {  return cardOrRow.element(by.id('editBtn')); };
  this.deleteBtn = function(cardOrRow) {  return cardOrRow.element(by.id('deleteBtn')); };
};

// Navigate to the Catalog view
CatalogPage.prototype.get = function(loggedIn) {
  var navbar = new Navbar();
  var dashboardPage = new DashboardPage();

  dashboardPage.get(loggedIn);
  navbar.clickCatalogNav();
  
  this.verify();
};

// Ensure that we are on the correct page
CatalogPage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

CatalogPage.prototype.applyTag = function(tagName) {
  // Type into the search filter, but do not press enter
  this.searchFilter.sendKeys(tagName);
  
  // Select first (only) suggestion from the autocomplete
  this.autocompleteSuggestions.then(function(suggestions) {
    expect(suggestions.length).toBe(1);
    suggestions[0].click();
  });
};

CatalogPage.prototype.applyFilter = function(text) {
  // Type into the search filter
  this.searchFilter.sendKeys(text);
  
  // Press the Enter key
  browser.actions().sendKeys(protractor.Key.ENTER).perform();
};

// setTo === true => enable cards view
// setTo === false => enable table view
// setTo === null => toggle
CatalogPage.prototype.toggleCardsView = function(setTo) {
  var self = this;
  helpers.hasClass(this.viewAsIcon, 'fa-table').then(function(showCards) {
    if ((showCards && setTo !== true) || (!showCards && setTo !== false)) {
      // We are currently in the cards view
      self.toggleCardsBtn.click();
      console.log("Toggling view...");
    }
  });
};

CatalogPage.prototype.installApplication = function(specKey) {
  var self = this;
  return helpers.selectByModel(self.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(card) {  // What to do with our match
    //helpers.scrollIntoViewAndClick(self.addBtn(card));
    self.addBtn(card).click();
  });
};

CatalogPage.prototype.viewJsonModal = function(specKey, asTable) {
  var self = this;
  return helpers.selectByModel(asTable ? self.table : self.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(match) {  // What to do with our match
    self.moreActionsDropdown(match).click();
    
    browser.wait(EC.elementToBeClickable(self.viewJsonBtn(match)), 5000);
    self.viewJsonBtn(match).click();
  });
};

CatalogPage.prototype.cloneSpec = function(oldKey, newKey, asTable) {
  var self = this;
  return helpers.selectByModel(asTable ? self.table : self.cards, "spec.key", function(key) { 
    return key === oldKey; // How to know we've found our match
  }, 
  function(match) {  // What to do with our match
    self.moreActionsDropdown(match).click();
    
    var cloneBtn = self.cloneBtn(match);
    browser.wait(EC.elementToBeClickable(cloneBtn), 5000);
    cloneBtn.click();
    
    browser.wait(EC.visibilityOf(self.cloneSpecModal), 5000);
    browser.wait(EC.visibilityOf(self.cloneKeyInput), 5000);
    
    var cloneKeyInput = self.cloneKeyInput;
    // Field should default to current key
    
    expect(cloneKeyInput.getAttribute('value')).toBe(oldKey);
    
    // Enter a new key
    cloneKeyInput.clear();
    cloneKeyInput.sendKeys(newKey);
    
    var confirmBtn = self.confirmBtn;
    browser.wait(EC.elementToBeClickable(confirmBtn), 5000);
    confirmBtn.click();
  });
};

CatalogPage.prototype.editSpec = function(specKey, asTable) {
  var self = this;
  return helpers.selectByModel(asTable ? self.table : self.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(match) {  // What to do with our match
    self.moreActionsDropdown(match).click();
    
    var editBtn = self.editBtn(match);
    browser.wait(EC.elementToBeClickable(editBtn), 5000);
    editBtn.click();
  });
};

CatalogPage.prototype.deleteSpec = function(specKey, asTable) {
  var self = this;
  return helpers.selectByModel(asTable ? self.table : self.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(match) {  // What to do with our match
    self.moreActionsDropdown(match).click();
    
    var deleteBtn = self.deleteBtn(match);
    browser.wait(EC.elementToBeClickable(deleteBtn), 5000);
    deleteBtn.click();
    
    browser.wait(EC.visibilityOf(self.deleteSpecModal), 5000);
    
    var confirmBtn = self.confirmBtn;
    browser.wait(EC.elementToBeClickable(confirmBtn), 5000);
    confirmBtn.click();
  });
};

CatalogPage.prototype.clickViewDocumentation = function(specKey, asTable) {
  var self = this;
  return helpers.selectByModel(asTable ? self.table : self.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(match) {  // What to do with our match
    self.moreActionsDropdown(match).click();
    
    var viewDocsBtn = self.viewDocsBtn(match);
    browser.wait(EC.elementToBeClickable(viewDocsBtn), 5000);
    viewDocsBtn.click();
  });
};

CatalogPage.prototype.clickHelpLink = function(specKey, asTable) {
  var self = this;
  return helpers.selectByModel(asTable ? self.table : self.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(match) {  // What to do with our match
    self.helpLink(match).click();
  });
};

module.exports = CatalogPage;
