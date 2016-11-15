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

var CatalogPage = function() {
  this.searchFilter = element(by.id('filterTagsInput'));
  this.removeTagBtn = element(by.css('[ng-click="$removeTag()"]'));
  this.toggleCardsBtn = element(by.id('toggleCardsBtn'));
  this.viewAsIcon = element(by.id('viewAsIcon'));
  this.importButton = element(by.id('importApplicationBtn'));
  this.createButton = element(by.id('createApplicationBtn'));
  this.autocompleteSuggestions = element.all(by.repeater('item in suggestionList.items track by track(item)'));
  this.table = element.all(by.repeater("spec in specs | display | showTags:tags.selected | orderBy:'label' track by spec.key"));
  this.cards = element.all(by.repeater('spec in set'));
    
  // Pass in a card or table row to get its inner buttons
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
  helpers.hasClass(this.viewAsIcon, 'fa-table').then(function(hasClass) {
    if (hasClass && setTo !== true) {
      // We are currently in the cards view
      self.toggleCardsBtn.click();
    } else if (!hasClass && setTo !== false) {
      self.toggleCardsBtn.click();
    }
  });
};

CatalogPage.prototype.installApplication = function(specKey) {
  var model = this;
  return helpers.selectByModel(model.cards, "spec.key", function(key) { 
    return key === specKey; // How to know we've found our match
  }, 
  function(card) {  // What to do with our match
    //helpers.scrollIntoViewAndClick(model.addBtn(card));
    model.addBtn(card).click();
  });
};

module.exports = CatalogPage;
