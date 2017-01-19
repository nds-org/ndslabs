/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var Navbar = require('./pages/navbar.page.js');
var LandingPage = require("./pages/landing.page.js");
var LoginPage = require("./pages/login.page.js");
var SignUpPage = require("./pages/signup.page.js");
var ContactUsPage = require("./pages/help.page.js");
var ResetPasswordPage = require("./pages/reset.page.js");
var SwaggerUiPage = require("./pages/swagger.page.js");

var DashboardPage = require("./pages/dashboard.page.js");
var CatalogPage = require("./pages/catalog.page.js");

var TIMEOUT_EXPECT_NEW_TAB = 30000;

// landing.e2e.js
describe('Labs Workbench Navbar', function() {
  "use strict";

  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var loginPage = new LoginPage();
  var signUpPage = new SignUpPage();
  var contactUsPage = new ContactUsPage();
  var resetPasswordPage = new ResetPasswordPage();
  var swaggerUiPage = new SwaggerUiPage();
  
  var dashboardPage = new DashboardPage();
  var catalogPage = new CatalogPage();
  
  beforeAll(function() { helpers.beforeAll(); });
  beforeEach(function() { 
    helpers.beforeEach(); 
    landingPage.get();
  });
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  it('should link back to the landing page', function() {
    loginPage.get();
    navbar.clickBrandNav();
    landingPage.verify();
  });
  
  it('should link to the Feature Overview wiki page', function(done) {
    navbar.expandHelpDropdown();
    navbar.clickHelpLink(0);
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the F.A.Q. wiki page', function(done) {
    navbar.expandHelpDropdown();
    navbar.clickHelpLink(1);
    helpers.expectNewTabOpen(shared.config.FAQ_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the User\'s Guide wiki page', function(done) {
    navbar.expandHelpDropdown();
    navbar.clickHelpLink(2);
    helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the Developer\'s Guide wiki page', function(done) {
    navbar.expandHelpDropdown();
    navbar.clickHelpLink(3);
    helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the Acceptable Use Policy wiki page', function(done) {
    navbar.expandHelpDropdown();
    navbar.clickHelpLink(4);
    helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK).then(function() {
      done();
    });
  }, TIMEOUT_EXPECT_NEW_TAB);
  
  it('should link to the api reference view', function() {
    navbar.expandHelpDropdown();
    navbar.clickApiReferenceNav();
    swaggerUiPage.verify();
  });
  
  it('should link to the contact us view', function() {
    navbar.expandHelpDropdown();
    navbar.clickContactUsNav();
    contactUsPage.verify();
  });
  
  it('should link to the login view', function() {
    navbar.clickSignIn();
    loginPage.verify();
  });
  
  it('should link to the signup view', function() {
    navbar.clickSignUp();
    signUpPage.verify();
  });
  
  describe('After Sign In', function() {
    beforeAll(function() {
      dashboardPage.get();
    });
    
    afterAll(function() {
      navbar.expandAccountDropdown();
      navbar.clickSignOut();
      landingPage.verify();
    });
    
    it('should link back to the landing page', function() {
      dashboardPage.get(true);
      navbar.clickBrandNav();
      landingPage.verify();
    });
  
    it('should link to the Feature Overview wiki page', function(done) {
      navbar.expandHelpDropdown();
      navbar.clickHelpLink(0);
      helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the F.A.Q. wiki page', function(done) {
      navbar.expandHelpDropdown();
      navbar.clickHelpLink(1);
      helpers.expectNewTabOpen(shared.config.FAQ_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the User\'s Guide wiki page', function(done) {
      navbar.expandHelpDropdown();
      navbar.clickHelpLink(2);
      helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the Developer\'s Guide wiki page', function(done) {
      navbar.expandHelpDropdown();
      navbar.clickHelpLink(3);
      helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the Acceptable Use Policy wiki page', function(done) {
      navbar.expandHelpDropdown();
      navbar.clickHelpLink(4);
      helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK).then(function() {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);
    
    it('should link to the api reference view', function() {
      navbar.expandHelpDropdown();
      navbar.clickApiReferenceNav();
      swaggerUiPage.verify();
    });
    
    it('should link to the contact us view', function() {
      navbar.expandHelpDropdown();
      navbar.clickContactUsNav();
      contactUsPage.verify();
    });
    
    it('should link to the dashboard view', function() {
      navbar.clickApplicationsNav();
      dashboardPage.verify();
    });
    
    it('should link to the catalog view', function() {
      navbar.clickCatalogNav();
      catalogPage.verify();
    });
    
    // FIXME: Figure out how to handle basic auth via protractor
    /*it('should allow the user to launch the file manager and take them to it', function(done) {
      //navbar.clickFilesNav();
      //helpers.expectNewTabOpen(/^https\:\/\/.*\-cloudcmd\.$/).then(function(done) {
        done();
      });
    }, TIMEOUT_EXPECT_NEW_TAB);*/
    
    it('should link to the change password view', function() {
      navbar.expandAccountDropdown();
      navbar.clickChangePasswordNav();
      resetPasswordPage.verify();
    });
    
    it('should allow the user to sign out', function() {
      navbar.expandAccountDropdown();
      navbar.clickSignOut();
      landingPage.verify();
      
      // Log back in to reset test state
      dashboardPage.get();
    });
  });
  
});