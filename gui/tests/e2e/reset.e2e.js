/* global protractor:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

// Import shared PageObjects
var shared = require('./pages/shared.page.js');
var helpers = require('./helpers.e2e.js');

var Navbar = require('./pages/navbar.page.js');
var LoginPage = require('./pages/login.page.js');
var DashboardPage = require('./pages/dashboard.page.js');
var ResetPasswordPage = require('./pages/reset.page.js');
var LandingPage = require('./pages/landing.page.js');

var TEST_VALID_USERNAME = shared.config.TEST_USERNAME;
var TEST_INVALID_USERNAME = shared.config.TEST_NEW_USERNAME;
var TEST_ORIGINAL_PASSWORD = shared.config.TEST_PASSWORD;
var TEST_NEW_PASSWORD = '123password';
var TEST_INVALID_PASSWORD_TOOSHORT = shared.config.TEST_INVALID_PASSWORD_TOOSHORT;
var TEST_INVALID_PASSWORD_MISMATCH = shared.config.TEST_INVALID_PASSWORD_MISMATCH;

// dashboard.e2e.js
describe('Labs Workbench Reset Password View', function() {
  "use strict";

  var navbar = new Navbar();
  var landingPage = new LandingPage();
  var loginPage = new LoginPage();
  var dashboardPage = new DashboardPage();
  var resetPasswordPage = new ResetPasswordPage();

  var loggedIn = false;
  
  beforeAll(function() { 
    helpers.beforeAll();
  });
  
  beforeEach(function() {
    helpers.beforeEach();
    resetPasswordPage.get(loggedIn);
  });
  
  afterEach(function() { 
    helpers.afterEach();
  });
  
  afterAll(function() { 
    helpers.afterAll();
  });
  
  // FIXME: How do we verify e-mail workflows?
  // FIXME: Move this to helpers
  var expectBtn = function(btn, enabled) {
    helpers.scrollIntoView(btn);
    expect(btn.isDisplayed()).toBe(true);
    expect(btn.isEnabled()).toBe(enabled ? true : false);  // Handles null / undefined / etc
    return btn;
  };
  
  it('should accept a valid username to reset their password', function() {
    var usernameInput = resetPasswordPage.usernameInput;
    usernameInput.sendKeys(TEST_VALID_USERNAME);
    
    var submitBtn = resetPasswordPage.submitUsernameBtn;
    expectBtn(submitBtn, true);
    /*expectBtn(submitBtn, true).click();
    
    // We should see our confirmation banner
    expect(resetPasswordPage.emailSentHelperText.isPresent()).toBe(true);
    expect(resetPasswordPage.emailSentHelperText.isDisplayed()).toBe(true);*/
  });
  
  it('should accept an invalid username', function() {
    var usernameInput = resetPasswordPage.usernameInput;
    usernameInput.sendKeys(TEST_INVALID_USERNAME);
    
    var submitBtn = resetPasswordPage.submitUsernameBtn;
    expectBtn(submitBtn, true);
    /*expectBtn(submitBtn, true).click();
    
    // Even though username is invalid, we should expect the same behavior
    expect(resetPasswordPage.emailSentHelperText.isPresent()).toBe(true);
    expect(resetPasswordPage.emailSentHelperText.isDisplayed()).toBe(true);*/
  });
  
  describe('After Sign In', function() {
    beforeAll(function() {
      dashboardPage.get(); 
      loggedIn = true;
    });
    
    beforeEach(function() {
      // Ensure we are on the ResetPassword view
      resetPasswordPage.get(loggedIn = true);
      
      // Reset the view (hide the confirmation banner, if it is displayed)
      browser.driver.navigate().refresh();
    });
    
    afterAll(function() {
      // Log out to reset test state
      navbar.accountDropdown.click();
      navbar.logoutBtn.click();
      
      // Bug? See NDS-638
      landingPage.verify();
      
      loggedIn = false;
    });
    
    it('should accept passwords matching the confirmation', function() {
      var newPasswordInput = resetPasswordPage.newPasswordInput;
      var newPasswordConfirmationInput = resetPasswordPage.newPasswordConfirmationInput;
      var submitBtn = resetPasswordPage.submitPasswordBtn;
      
      var passwordChangedHelperText = resetPasswordPage.passwordChangedHelperText;
      
      // Expect passwords to match
      expectBtn(submitBtn, false);
      newPasswordInput.sendKeys(TEST_NEW_PASSWORD);
      expectBtn(submitBtn, false);
      newPasswordConfirmationInput.sendKeys(TEST_NEW_PASSWORD);
      
      // Click the submit button
      expectBtn(submitBtn, true).click();
      
      // We should see our confirmation banner
      expect(passwordChangedHelperText.isPresent()).toBe(true);
      expect(passwordChangedHelperText.isDisplayed()).toBe(true);
      
      // Log out to reset test state
      navbar.accountDropdown.click();
      navbar.logoutBtn.click();
      landingPage.verify();
      
      // Log in again to ensure password actually changed
      loginPage.get();
      loginPage.usernameInput.sendKeys(TEST_VALID_USERNAME);
      loginPage.passwordInput.sendKeys(TEST_NEW_PASSWORD);
      loginPage.loginBtn.click();
      dashboardPage.verify();
      
      // Reset the view (hide the confirmation banner, if it is displayed)
      browser.driver.navigate().refresh();
      
      // Ensure we are on the ResetPassword view
      resetPasswordPage.get(true);
      
      // Change password back to original to reset test state
      resetPasswordPage.newPasswordInput.sendKeys(TEST_ORIGINAL_PASSWORD);
      resetPasswordPage.newPasswordConfirmationInput.sendKeys(TEST_ORIGINAL_PASSWORD);
      resetPasswordPage.submitPasswordBtn.click();
      
      // We should see our confirmation banner
      expect(passwordChangedHelperText.isPresent()).toBe(true);
      expect(passwordChangedHelperText.isDisplayed()).toBe(true);
    });
    
    it('should prohibit passwords less than 6 characters', function() {
      var newPasswordInput = resetPasswordPage.newPasswordInput;
      var newPasswordConfirmationInput = resetPasswordPage.newPasswordConfirmationInput;
      var submitBtn = resetPasswordPage.submitPasswordBtn;
      
      var passwordChangedHelperText = resetPasswordPage.passwordChangedHelperText;
      
      // Expect passwords to be too short
      expectBtn(submitBtn, false);
      newPasswordInput.sendKeys(TEST_INVALID_PASSWORD_TOOSHORT);
      expectBtn(submitBtn, false);
      newPasswordConfirmationInput.sendKeys(TEST_INVALID_PASSWORD_TOOSHORT);
      expectBtn(submitBtn, false);
      
      // We should not see our confirmation banner
      expect(passwordChangedHelperText.isPresent()).toBe(true);
      expect(passwordChangedHelperText.isDisplayed()).toBe(false);
    });
    
    it('should prohibit mismatched passwords', function() {
      var newPasswordInput = resetPasswordPage.newPasswordInput;
      var newPasswordConfirmationInput = resetPasswordPage.newPasswordConfirmationInput;
      var submitBtn = resetPasswordPage.submitPasswordBtn;
      
      var passwordChangedHelperText = resetPasswordPage.passwordChangedHelperText;
      
      // Expect passwords to be mismatched
      expectBtn(submitBtn, false);
      newPasswordInput.sendKeys(TEST_NEW_PASSWORD);
      expectBtn(submitBtn, false);
      newPasswordConfirmationInput.sendKeys(TEST_INVALID_PASSWORD_MISMATCH);
      expectBtn(submitBtn, false);
      
      // We should not see our confirmation banner
      expect(passwordChangedHelperText.isPresent()).toBe(true);
      expect(passwordChangedHelperText.isDisplayed()).toBe(false);
    });
  });
});