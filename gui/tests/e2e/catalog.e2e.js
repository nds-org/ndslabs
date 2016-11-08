/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

'use strict';

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require('./pages/landing.page.js');
var dashboard = require('./pages/dashboard.page.js');
var CatalogPage = require('./pages/catalog.page.js');

var _ = require('lodash');

// catalog.e2e.js
describe('Labs Workbench Catalog View', function() {  
  var catalogPage = new CatalogPage();

  beforeAll(function() { 
    console.log("Now Testing: Labs Workbench Catalog View");
    
    helpers.beforeAll();
    dashboard.get();
  });
  
  beforeEach(function() {
    helpers.beforeEach(); 
    catalogPage.get(true);
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
    shared.navbar.expandAccountDropdown();
    shared.navbar.clickSignOut();
    landing.verify();
  });
  
  it('should verify page', function() {
    var target = 'cloud9go';
    /*catalogPage.cards.filter(function (card) {
      return card.evaluate("spec.key").then(function (key) {
          return key == target;
      });
    }).then(function (matches) {
      if (matches) {  // we have a match - find and click the Add button
        matches[0].element(by.id('addBtn')).click();
      }
    });*/
    helpers.selectByModel(catalogPage.cards, "spec.key", function(key) { 
      return key === target 
    }, 
    function(card) { 
      card.element(by.id('addBtn')).click();
    });
  });
});