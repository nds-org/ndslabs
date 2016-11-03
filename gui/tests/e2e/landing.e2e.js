/* global angular:false expect:false inject:false module:false element:false browser:false by:false beforeAll:false afterAll:false */

"use strict"

// Import shared PageObjects
var helpers = require("./helpers.e2e.js");
var shared = require("./pages/shared.page.js");

var landing = require("./pages/landing.page.js");
var login = require("./pages/login.page.js");

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
    expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/register');
  });

  it('should offer sign-in', function() {
    landing.clickSignIn();
    
    // We should be taken to the Sign In View
    login.verify();
  });
  
  it('should offer help link 0', function() {
    landing.clickHelpLink(0);
    helpers.expectNewTabOpen(shared.config.FEATURE_OVERVIEW_LINK);
  });
  
  it('should offer help link 1', function() {
    landing.clickHelpLink(1);
    helpers.expectNewTabOpen(shared.config.FAQ_LINK);
  });
  
  it('should offer help link 2', function() {
    landing.clickHelpLink(2);
    helpers.expectNewTabOpen(shared.config.USER_GUIDE_LINK);
  });
  
  it('should offer help link 3', function() {
    landing.clickHelpLink(3);
    helpers.expectNewTabOpen(shared.config.DEV_GUIDE_LINK);
  });
  
  it('should offer help link 4', function() {
    landing.clickHelpLink(4);
    helpers.expectNewTabOpen(shared.config.USE_POLICY_LINK);
  });
  
  it('should offer API reference link', function() { 
    landing.clickApiLink(function() {
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/swagger');
    });
  });
  
  it('should offer "Contact Us" link', function() { 
    landing.clickContactUsLink(function() {
      expect(browser.getCurrentUrl()).toBe(shared.config.TEST_HOSTNAME + '/contact');
    });
  });
});