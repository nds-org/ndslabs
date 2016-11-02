/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

describe('Labs Workbench', function() {
  var ptor;
  
  // TODO: Load these from a config file on .gitignore
  var TEST_HOSTNAME = 'https://www.mldev.ndslabs.org/#';
  // var TEST_HOSTNAME = 'https://www.workbench.nationaldataservice.org/';
  
  var TEST_USERNAME = 'lambert8';
  var TEST_PASSWORD = '123456';
  
  var TEST_INVALID_PASSWORD = '654321';
  
  var TEST_PRODUCT_NAME = 'Labs Workbench';
  
  var INPUT_USERNAME_ID = 'inputNamespace';
  var INPUT_PASSWORD_ID = 'inputPassword';
  
  // Start driver, and navigate to test subject
  beforeEach(function() {
    // Read these in via e2e.conf.js from e2e.auth.js
    TEST_HOSTNAME = browser.params.hostname;
    TEST_USERNAME = browser.params.username;
    TEST_PASSWORD = browser.params.password;
    
    // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
    // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
    browser.driver.manage().window().setSize(1280, 1024);
  });
  
  // TODO: Extra expectations?
  afterEach(function() {  });
  
  // landing.e2e.js
  describe('Labs Workbench Landing Page View', function() {
    beforeEach(function() { 
      browser.get(TEST_HOSTNAME);
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/');
      expect(browser.getTitle()).toEqual('Labs Workbench Landing Page');
    });
    
    it('should offer sign-up', function() {
      element(by.id('signUpBtn')).click();
      
      // We should be taken to the Sign Up View
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/register');
    });
  
    it('should offer sign-in', function() { 
      element(by.id('signInBtn')).click();
      
      // We should be taken to the Sign In View
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/login');
    });
  });
  
  
  // login.e2e.js
  describe('Labs Workbench Login View', function() {
    beforeEach(function() {
      browser.get(TEST_HOSTNAME);
      element(by.id('signInBtn')).click();
      
      // Ensure we are on the login page
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/login');
      expect(browser.getTitle()).toEqual('Sign In to Labs Workbench');
      
      // Ensure our expected elements are present and visible
      expect(element(by.id(INPUT_USERNAME_ID)).isPresent()).toBe(true);
      expect(element(by.id(INPUT_USERNAME_ID)).isDisplayed()).toBe(true);
      expect(element(by.id(INPUT_PASSWORD_ID)).isPresent()).toBe(true);
      expect(element(by.id(INPUT_PASSWORD_ID)).isDisplayed()).toBe(true);
    });
    
    // 
    it('should deny invalid login', function() {
      element(by.id(INPUT_USERNAME_ID)).sendKeys(TEST_USERNAME);
      element(by.id(INPUT_PASSWORD_ID)).sendKeys(TEST_INVALID_PASSWORD);
      
      // TODO: change this to id selector
      element(by.css('[ng-click="login()"]')).click();
      
      // We should remain on the login view
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/login');
    });
    
    
    it('should deny invalid login', function() {
      element(by.id(INPUT_USERNAME_ID)).sendKeys(TEST_USERNAME);
      element(by.id(INPUT_PASSWORD_ID)).sendKeys(TEST_PASSWORD);
      
      // TODO: change this to id selector
      element(by.css('[ng-click="login()"]')).click();
      
      // We should be taken to the Dashboard View
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/home');
    });
  });
});