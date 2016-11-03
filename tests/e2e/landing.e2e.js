/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var shared = require('./pageObjects/shared.page.js');

// landing.e2e.js
describe('Labs Workbench Landing Page View', function() {
  beforeEach(function() { shared.beforeEach(); });
  beforeAll(function() { shared.beforeAll(); });
  afterEach(function() { shared.afterEach(); });
  afterAll(function() { shared.afterAll(); });
  
  it('should offer a "Learn More" button', function() {
    shared.expectNewTabOpenOnClick(element(by.id('learnMoreBtn')), shared.config.FEATURE_OVERVIEW_LINK);
  });
  
  it('should offer sign-up', function() {
    element(by.id('signUpBtn')).click();
    
    // We should be taken to the Sign Up View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/register');
  });

  it('should offer sign-in', function() { 
    element(by.id('signInBtn')).click();
    
    // We should be taken to the Sign In View
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/login');
  });
  
  it('should offer help links', function() { 
    shared.expectNewTabOpenOnClick(element(by.id('helpLink0')), shared.config.FEATURE_OVERVIEW_LINK);
    shared.expectNewTabOpenOnClick(element(by.id('helpLink1')), shared.config.FAQ_LINK);
    shared.expectNewTabOpenOnClick(element(by.id('helpLink2')), shared.config.USER_GUIDE_LINK);
    shared.expectNewTabOpenOnClick(element(by.id('helpLink3')), shared.config.DEV_GUIDE_LINK);
    shared.expectNewTabOpenOnClick(element(by.id('helpLink4')), shared.config.USE_POLICY_LINK);
  });
  
  it('should offer API reference link', function() { 
    browser.executeScript('window.scrollTo(0,10000);').then(function () {
      element(by.id('apiLink')).click();
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/swagger');
    });
  });
  
  it('should offer "Contact Us" link', function() { 
    browser.executeScript('window.scrollTo(0,10000);').then(function () {
      element(by.id('contactUsLink')).click();
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/contact');
    });
  });
});