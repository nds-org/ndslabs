/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require("./pages/landing.page.js");
var LoginPage = require("./pages/login.page.js");
var SignUpPage = require("./pages/signup.page.js");

var DashboardPage = require("./pages/dashboard.page.js");
var CatalogPage = require("./pages/catalog.page.js");
var AddSpecPage = require("./pages/addEditSpec.page.js");

var TIMEOUT_EXPECT_NEW_TAB = 30000;

// landing.e2e.js
describe('Labs Workbench Landing Page View', function() {
  "use strict";

  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var loginPage = new LoginPage();
  var signUpPage = new SignUpPage();
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  var addSpecPage = new AddSpecPage();
  
  beforeAll(function() { helpers.beforeAll(); });
  beforeEach(function() { 
    helpers.beforeEach(); 
    landingPage.get();
  });
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  it('should offer a "Learn More" button', function(done) {
    landingPage.clickLearnMore();
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should offer sign-up', function() {
    landingPage.clickSignUp();
    
    // We should be taken to the Sign Up View
    signUpPage.verify();
  });

  it('should offer sign-in', function() {
    landingPage.clickSignIn();
    
    // We should be taken to the Login View
    loginPage.verify();
  });
  
  it('should link to the Feature Overview wiki page', function(done) {
    landingPage.clickHelpLink(0);
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the F.A.Q. wiki page', function(done) {
    landingPage.clickHelpLink(1);
    helpers.expectNewTabOpen(shared.config.FAQ_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the User\'s Guide wiki page', function(done) {
    landingPage.clickHelpLink(2);
    helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the Developer\'s Guide wiki page', function(done) {
    landingPage.clickHelpLink(3);
    helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the Acceptable Use Policy wiki page', function(done) {
    landingPage.clickHelpLink(4);
    helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link user to the "Swagger UI" view', function() { 
    landingPage.clickApiLink(function() {
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/swagger');
    });
  });
  
  it('should link user to the "Contact Us" view', function() { 
    landingPage.clickContactUsLink(function() {
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/contact');
    });
  });
  
  describe('Landing Page View while Signed In', function() {
    beforeAll(function() {
      dashboardPage.get();
    });
    
    afterAll(function() {
      navbar.expandAccountDropdown();
      navbar.clickSignOut();
      landingPage.verify();
    });
      
    it('should link user to dashboard', function() {
      landingPage.clickDashboardLink();
      dashboardPage.verify();
    });
    
    it('should link user to catalog', function() {
      landingPage.clickCatalogLink();
      catalogPage.verify();
    });
    
    it('should link user to create a new application', function() {
      landingPage.clickCatalogAddLink();
      addSpecPage.verify();
    });
  });
});