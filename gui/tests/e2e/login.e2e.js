/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var helpers = require('./helpers.e2e.js');
var shared = require('./pages/shared.page.js');

var Navbar = require('./pages/navbar.page.js');
var LoginPage = require('./pages/login.page.js');
var LandingPage = require('./pages/landing.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var ResetPasswordPage = require('./pages/reset.page.js');
var SignUpPage = require('./pages/signup.page.js');

var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;
var TEST_INVALID_PASSWORD_MISMATCH = shared.config.TEST_INVALID_PASSWORD_MISMATCH;

// login.e2e.js
describe('Labs Workbench Login View', function() {
  "use strict";

  var navbar = new Navbar();
  var loginPage = new LoginPage();
  var signUpPage = new SignUpPage();
  var resetPasswordPage = new ResetPasswordPage();
  var dashboardPage = new DashboardPage();
  var landingPage = new LandingPage();
  
  beforeAll(function() { helpers.beforeAll(); });
  
  beforeEach(function() { 
    helpers.beforeEach(); 
    loginPage.get();
  });
  
  afterEach(function() { helpers.afterEach(); });
  afterAll(function() { helpers.afterAll(); });
  
  // Do not allow user past login view with invalid credentials
  it('should deny invalid login', function() {
    // Attempt to sign in with invalid credentials
    loginPage.enterUsername(TEST_USERNAME);
    loginPage.enterPassword(TEST_INVALID_PASSWORD_MISMATCH);
    loginPage.clickLogin();
    
    // We should remain on the login view
    loginPage.verify();
  });
  
  // Allow user past login view with valid credentials
  it('should accept valid login', function() {
    // Attempt to sign in with valid credentials
    loginPage.enterUsername(TEST_USERNAME);
    loginPage.enterPassword(TEST_PASSWORD);
    loginPage.clickLogin();
    
    // We should be taken to the Dashboard View
    dashboardPage.verify();
    
    // Log out to reset test state
    navbar.expandAccountDropdown();
    navbar.clickSignOut();
    landingPage.verify();
  });
  
  it('should link to the Reset Password view', function() {
    loginPage.clickForgotPasswordLink();
    resetPasswordPage.verify();
  });
  
  it('should link to the Sign Up view', function() {
    loginPage.clickRequestAccessLink();
    signUpPage.verify();
  });
});