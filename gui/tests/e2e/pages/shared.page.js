/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

var accountDropdown = function() {  return element(by.css('[class="dropdown-toggle ng-binding"]')); };
var logoutBtn = function() {  return element(by.css('[ng-click="logout()"]')); };

module.exports.signOut = function() {
  // TODO: change this to id selector
  accountDropdown().click();
  
  // TODO: change this to id selector
  logoutBtn().click();
};

module.exports.config = {
  // Load these from the e2e.auth.json file
  TEST_HOSTNAME: browser.params.hostname,
  TEST_USERNAME: browser.params.username,
  TEST_PASSWORD: browser.params.password,
  TEST_EMAIL: browser.params.email,
  TEST_NEW_FULLNAME: browser.params.name,
  TEST_NEW_ORGANIZATION: browser.params.organization,
  TEST_NEW_DESCRIPTION: browser.params.description,
  TEST_NEW_EMAIL: browser.params['email-alternative'] || browser.params.email,
  TEST_NEW_USERNAME: browser.params['username-alternative'] || browser.params.username,
  
  TEST_INVALID_PASSWORD_MISMATCH: '654321',
  TEST_INVALID_PASSWORD_TOOSHORT: '123',
  
  PRODUCT_NAME: 'Labs Workbench',
  
  FEATURE_OVERVIEW_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Feature+Overview',
  FAQ_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Frequently+Asked+Questions',
  USER_GUIDE_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/User%27s+Guide',
  DEV_GUIDE_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Developer%27s+Guide',
  USE_POLICY_LINK: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy'
};