/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require("./pages/landing.page.js");
var login = require("./pages/login.page.js");
var signup = require("./pages/signup.page.js");
var help = require("./pages/help.page.js");
var reset = require("./pages/reset.page.js");
var swagger = require("./pages/swagger.page.js");

var dashboard = require("./pages/dashboard.page.js");
var catalog = require("./pages/catalog.page.js");

// landing.e2e.js
describe('Labs Workbench Navbar', function() {
  beforeAll(function() { helpers.beforeAll(); });
  beforeEach(function() { 
    helpers.beforeEach(); 
    landing.get();
  });
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  it('should link back to the landing page', function() {
    login.get();
    shared.navbar.clickBrandNav();
    landing.verify();
  });
  
  it('should link to the Feature Overview wiki page', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickHelpLink(0);
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK);
  });
  
  it('should link to the F.A.Q. wiki page', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickHelpLink(1);
    helpers.expectNewTabOpen(shared.config.FAQ_LINK);
  });
  
  it('should link to the User\'s Guide wiki page', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickHelpLink(2);
    helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK);
  });
  
  it('should link to the Developer\'s Guide wiki page', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickHelpLink(3);
    helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK);
  });
  
  it('should link to the Acceptable Use Policy wiki page', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickHelpLink(4);
    helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK);
  });
  
  it('should link to the api reference view', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickApiReferenceNav();
    swagger.verify();
  });
  
  it('should link to the contact us view', function() {
    shared.navbar.expandHelpDropdown();
    shared.navbar.clickContactUsNav();
    help.verify();
  });
  
  it('should link to the login view', function() {
    shared.navbar.clickSignIn();
    login.verify();
  });
  
  it('should link to the signup view', function() {
    shared.navbar.clickSignUp();
    signup.verify();
  });
  
  describe('After Sign In', function() {
    beforeAll(function() {
      dashboard.get();
    });
    
    afterAll(function() {
      shared.navbar.expandAccountDropdown();
      shared.navbar.clickSignOut();
      landing.verify();
    });
    
    it('should link back to the landing page', function() {
      dashboard.get(true);
      shared.navbar.clickBrandNav();
      landing.verify();
    });
  
    it('should link to the Feature Overview wiki page', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickHelpLink(0);
      helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK);
    });
    
    it('should link to the F.A.Q. wiki page', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickHelpLink(1);
      helpers.expectNewTabOpen(shared.config.FAQ_LINK);
    });
    
    it('should link to the User\'s Guide wiki page', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickHelpLink(2);
      helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK);
    });
    
    it('should link to the Developer\'s Guide wiki page', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickHelpLink(3);
      helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK);
    });
    
    it('should link to the Acceptable Use Policy wiki page', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickHelpLink(4);
      helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK);
    });
    
    it('should link to the api reference view', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickApiReferenceNav();
      swagger.verify();
    });
    
    it('should link to the contact us view', function() {
      shared.navbar.expandHelpDropdown();
      shared.navbar.clickContactUsNav();
      help.verify();
    });
    
    it('should link to the dashboard view', function() {
      shared.navbar.clickApplicationsNav();
      dashboard.verify();
    });
    
    it('should link to the catalog view', function() {
      shared.navbar.clickCatalogNav();
      catalog.verify();
    });
    
    // FIXME: Figure out how to handle basic auth via protractor
    it('should allow the user to launch the file manager and take them to it', function() {
      //shared.navbar.clickFilesNav();
      //helpers.expectNewTabOpen(/https\:\/\/.*\-cloudcmd\..*/);
    });
    
    it('should link to the change password view', function() {
      shared.navbar.expandAccountDropdown();
      shared.navbar.clickChangePasswordNav();
      reset.verify();
    });
    
    it('should allow the user to sign out', function() {
      shared.navbar.expandAccountDropdown();
      shared.navbar.clickSignOut();
      landing.verify();
      
      // Log back in to reset test state
      dashboard.get();
    });
  });
  
});