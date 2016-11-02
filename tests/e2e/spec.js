/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false */

"use strict"

describe('Labs Workbench', function() {
  var ptor;
  
  // Load these from athe e2e.auth.json file
  var TEST_HOSTNAME = '';
  var TEST_USERNAME = '';
  var TEST_PASSWORD = '';
  
  var TEST_INVALID_PASSWORD = '654321';
  
  var TEST_PRODUCT_NAME = 'Labs Workbench';
  
  var INPUT_USERNAME_ID = 'inputNamespace';
  var INPUT_PASSWORD_ID = 'inputPassword';
  
  var FEATURE_OVERVIEW_LINK = 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Feature+Overview';
  var FAQ_LINK = 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Frequently+Asked+Questions';
  var USER_GUIDE_LINK = 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/User%27s+Guide';
  var DEV_GUIDE_LINK = 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Developer%27s+Guide';
  var USE_POLICY_LINK = 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy';
  
  
  var startOnLoginView = function() {
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
  };
  
  var startOnDashboardView = function() {
    browser.get(TEST_HOSTNAME);
    element(by.css('[id="dashboardLink"]')).click();
    
    // Ensure we are on the dashboard page
    expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/home');
    expect(browser.getTitle()).toEqual('Labs Workbench Dashboard');
  };
  
  var expectNewTabOpenOnClick = function(element, expectedUrl) {
    browser.ignoreSynchronization = true;
      
    element.click();
    browser.getAllWindowHandles().then(function (handles) {
      // Switch to new tab and verify that its URL is correct
      browser.driver.switchTo().window(handles[1]);
      expect(browser.getCurrentUrl()).toBe(expectedUrl);
      
      // Close current tab and switch back to original
      browser.driver.close();
      browser.driver.switchTo().window(handles[0]);
    });
  };
  
  var signIn = function(username, password) {
      element(by.id(INPUT_USERNAME_ID)).sendKeys(username);
      element(by.id(INPUT_PASSWORD_ID)).sendKeys(password);
      
      // TODO: change this to id selector
      element(by.css('[ng-click="login()"]')).click();
  };
  
  var signOut = function() {
    // TODO: change this to id selector
    element(by.css('[class="dropdown-toggle ng-binding"]')).click();
    
    // TODO: change this to id selector
    element(by.css('[ng-click="logout()"]')).click();
  };
  
  // Start driver, and navigate to test subject
  beforeAll(function() {
    // Read these in via e2e.conf.js from e2e.auth.js
    TEST_HOSTNAME = browser.params.hostname;
    TEST_USERNAME = browser.params.username;
    TEST_PASSWORD = browser.params.password;
    
    // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
    // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
    browser.driver.manage().window().setSize(1280, 1024);
  });
  
  // TODO: Extra expectations?
  afterEach(function() {
    browser.ignoreSynchronization = false;
  });
  
  // landing.e2e.js
  describe('Labs Workbench Landing Page View', function() {
    beforeEach(function() { 
      browser.get(TEST_HOSTNAME);
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/');
      expect(browser.getTitle()).toEqual('Labs Workbench Landing Page');
    });
    
    it('should offer a "Learn More" button', function() {
      expectNewTabOpenOnClick(element(by.id('learnMoreBtn')), FEATURE_OVERVIEW_LINK);
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
    
    it('should offer help links', function() { 
      expectNewTabOpenOnClick(element(by.id('helpLink0')), FEATURE_OVERVIEW_LINK);
      expectNewTabOpenOnClick(element(by.id('helpLink1')), FAQ_LINK);
      expectNewTabOpenOnClick(element(by.id('helpLink2')), USER_GUIDE_LINK);
      expectNewTabOpenOnClick(element(by.id('helpLink3')), DEV_GUIDE_LINK);
      expectNewTabOpenOnClick(element(by.id('helpLink4')), USE_POLICY_LINK);
    });
    
    it('should offer API reference link', function() { 
      browser.executeScript('window.scrollTo(0,10000);').then(function () {
        element(by.id('apiLink')).click();
        expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/swagger');
      });
    });
    
    it('should offer "Contact Us" link', function() { 
      browser.executeScript('window.scrollTo(0,10000);').then(function () {
        element(by.id('contactUsLink')).click();
        expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/contact');
      });
    });
  });
  
  // login.e2e.js
  describe('Labs Workbench Login View', function() {
    beforeEach(function() {
      browser.get(TEST_HOSTNAME);
    });
    
    // Do not allow user past login view with invalid credentials
    it('should deny invalid login', function() {
      startOnLoginView();
      
      // Attempt to sign in with vinalid credentials
      signIn(TEST_USERNAME, TEST_INVALID_PASSWORD);
      
      // TODO: change this to id selector
      element(by.css('[ng-click="login()"]')).click();
      
      // We should remain on the login view
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/login');
    });
    
    // Allow user past login view with valid credentials
    it('should accept valid login', function() {
      startOnLoginView();
      
      // Attempt to sign in with valid credentials
      signIn(TEST_USERNAME, TEST_PASSWORD);
      
      // We should be taken to the Dashboard View
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/home');
    });
    
    // Allow user to logout
    it('should allow logout', function() {
      startOnDashboardView();
      
      // We should be taken to the Dashboard View
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/home');
      
      // Sign out using helper function
      signOut();
      
      // We should be taken to the Landing Page View
      expect(browser.getCurrentUrl()).toBe(TEST_HOSTNAME + '/');
    });
  });
  
  // dashboard.e2e.js
  describe('Labs Workbench Dashboard View', function() {
    
  });
});