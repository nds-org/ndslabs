/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var landing = require('./landing.page.js');
var login = require('./login.page.js');
var DashboardPage = require('./dashboard.page.js');

var dashboardPage = new DashboardPage();

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;
var PAGE_TITLE = 'Labs Workbench Catalog';
var PAGE_ROUTE = TEST_HOSTNAME + '/store';

var CatalogPage = function() {
  this.searchFilter = element(by.id('filterTagsInput'));
  this.toggleCardsBtn = element(by.id('toggleCardsBtn'));
  this.tableIcon = element(by.id('tableIcon'));
  this.cardsIcon = element(by.id('cardsIcon'));
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

// Navigate to the catalog view
CatalogPage.prototype.get = function(loggedIn) {
  dashboardPage.get(loggedIn);
  shared.navbar.clickCatalogNav();
  
  this.verify();
};

// Ensure that we are on the correct page
CatalogPage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

CatalogPage.prototype.applyTag = function(tagName) {
// Type into the search filter, but do not press enter
  this.searchFilter.sendKeys(tagName);
  
  // Select first (only) suggestion from the autocomplete
  this.autocompleteSuggestions.then(function(suggestions) {
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions[0].click();
  });
};

CatalogPage.prototype.applyFilter = function(text) {
  // Type into the search filter
  this.searchFilter().sendKeys(text);
  
  // Press the Enter key
  browser.actions().sendKeys(protractor.Key.ENTER).perform();
};

CatalogPage.prototype.toggleCardsView = function(setTo) {
  if (setTo === true && this.cardsIcon().isPresent()) {         // Enable cards view
    this.toggleCardsBtn().click();
  } else if (setTo === false && this.tableIcon().isPresent()) { // Enable table view
    this.toggleCardsBtn().click();
  } else {                                                 // Toggle state
    this.toggleCardsBtn().click();
  } 
};

module.exports = CatalogPage;
