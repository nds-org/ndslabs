/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require("./pages/landing.page.js");
var login = require("./pages/login.page.js");
var signup = require("./pages/signup.page.js");

var dashboard = require("./pages/dashboard.page.js");
var catalog = require("./pages/catalog.page.js");
var addSpec = require("./pages/addEditSpec.page.js");

// landing.e2e.js
describe('Labs Workbench Landing Page View', function() {
  beforeAll(function() { helpers.beforeAll(); });
  beforeEach(function() { 
    helpers.beforeEach(); 
    landing.get();
  });
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  it('should offer a "Learn More" button', function() {
    landing.clickLearnMore();
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK);
  });
  
  it('should offer sign-up', function() {
    landing.clickSignUp();
    
    // We should be taken to the Sign Up View
    signup.verify();
  });

  it('should offer sign-in', function() {
    landing.clickSignIn();
    
    // We should be taken to the Login View
    login.verify();
  });
  
  it('should link to the Feature Overview wiki page', function() {
    landing.clickHelpLink(0);
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK);
  });
  
  it('should link to the F.A.Q. wiki page', function() {
    landing.clickHelpLink(1);
    helpers.expectNewTabOpen(shared.config.FAQ_LINK);
  });
  
  it('should link to the User\'s Guide wiki page', function() {
    landing.clickHelpLink(2);
    helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK);
  });
  
  it('should link to the Developer\'s Guide wiki page', function() {
    landing.clickHelpLink(3);
    helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK);
  });
  
  it('should link to the Acceptable Use Policy wiki page', function() {
    landing.clickHelpLink(4);
    helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK);
  });
  
  it('should link user to the "Swagger UI" view', function() { 
    landing.clickApiLink(function() {
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/swagger');
    });
  });
  
  it('should link user to the "Contact Us" view', function() { 
    landing.clickContactUsLink(function() {
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/contact');
    });
  });
  
  describe('Landing Page View while Signed In', function() {
    beforeAll(function() {
      dashboard.get();
    });
    
    afterAll(function() {
      shared.navbar.expandAccountDropdown();
      shared.navbar.clickSignOut();
      landing.verify();
    });
      
    it('should link user to dashboard', function() {
      landing.clickDashboardLink();
      dashboard.verify();
    });
    
    it('should link user to catalog', function() {
      landing.clickCatalogLink();
      catalog.verify();
    });
    
    it('should link user to create a new application', function() {
      landing.clickCatalogAddLink();
      addSpec.verify();
    });
  });
});