/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

var cfg = module.exports.config = {
  // Load these from the e2e.auth.json file
  TEST_HOSTNAME: browser.params.hostname,
  TEST_USERNAME: browser.params.username,
  TEST_PASSWORD: browser.params.password,
  
  TEST_INVALID_PASSWORD: '654321',
  
  TEST_PRODUCT_NAME: 'Labs Workbench',
  
  INPUT_USERNAME_ID: 'inputNamespace',
  INPUT_PASSWORD_ID: 'inputPassword',
  
  FEATURE_OVERVIEW_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Feature+Overview',
  FAQ_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Frequently+Asked+Questions',
  USER_GUIDE_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/User%27s+Guide',
  DEV_GUIDE_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Developer%27s+Guide',
  USE_POLICY_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy',
};

module.exports.startOnLandingView = function() {
  browser.get(cfg.TEST_HOSTNAME);
  expect(browser.getCurrentUrl()).toBe(cfg.TEST_HOSTNAME + '/');
  expect(browser.getTitle()).toEqual('Labs Workbench Landing Page');
};

module.exports.startOnLoginView = function() {
  browser.get(cfg.TEST_HOSTNAME);
  element(by.id('signInBtn')).click();
  
  // Ensure we are on the login page
  expect(browser.getCurrentUrl()).toBe(cfg.TEST_HOSTNAME + '/login');
  expect(browser.getTitle()).toEqual('Sign In to Labs Workbench');
  
  // Ensure our expected elements are present and visible
  expect(element(by.id(cfg.INPUT_USERNAME_ID)).isPresent()).toBe(true);
  expect(element(by.id(cfg.INPUT_USERNAME_ID)).isDisplayed()).toBe(true);
  expect(element(by.id(cfg.INPUT_PASSWORD_ID)).isPresent()).toBe(true);
  expect(element(by.id(cfg.INPUT_PASSWORD_ID)).isDisplayed()).toBe(true);
};

module.exports.startOnDashboardView = function() {
  browser.get(cfg.TEST_HOSTNAME);
  element(by.css('[id="dashboardLink"]')).click();
  
  // Ensure we are on the dashboard page
  expect(browser.getCurrentUrl()).toBe(cfg.TEST_HOSTNAME + '/home');
  expect(browser.getTitle()).toEqual('Labs Workbench Dashboard');
};
  
module.exports.signIn = function(username, password) {
  element(by.id(cfg.INPUT_USERNAME_ID)).sendKeys(username || cfg.TEST_USERNAME);
  element(by.id(cfg.INPUT_PASSWORD_ID)).sendKeys(password || cfg.TEST_PASSWORD);
  
  // TODO: change this to id selector
  element(by.css('[ng-click="login()"]')).click();
};
  
module.exports.signOut = function() {
  // TODO: change this to id selector
  element(by.css('[class="dropdown-toggle ng-binding"]')).click();
  
  // TODO: change this to id selector
  element(by.css('[ng-click="logout()"]')).click();
};

module.exports.expectNewTabOpenOnClick = function(element, expectedUrl) {
  browser.ignoreSynchronization = true;
  
  // Click the given element
  element.click();
  
  // Retrieve all open window handles
  browser.getAllWindowHandles().then(function (handles) {
    // Switch to new tab and verify that its URL is correct
    browser.driver.switchTo().window(handles[1]);
    expect(browser.getCurrentUrl()).toBe(expectedUrl);
    
    // Close current tab and switch back to original
    browser.driver.close();
    browser.driver.switchTo().window(handles[0]);
  });
};

module.exports.beforeAll = function() {
  // Resize window (fixes "Element is not clickable at point (x,y)" in OSX)
  // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/2766
  browser.driver.manage().window().setSize(1280, 1024);
};

module.exports.beforeEach = function() {
  module.exports.startOnLandingView();
};

module.exports.afterEach = function() {
  browser.ignoreSynchronization = false;
};

module.exports.afterAll = function() { };