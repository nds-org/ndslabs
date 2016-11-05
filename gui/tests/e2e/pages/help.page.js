/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var landing = require('./landing.page.js');

var TEST_HOSTNAME = shared.config.TEST_HOSTNAME;

var PAGE_TITLE = 'Contact Labs Workbench Support';
var PAGE_ROUTE = TEST_HOSTNAME + '/contact';

var BTN_FORUM_ID = 'ggroupBtn';
var BTN_CHAT_ID = 'gitterBtn';
var BTN_EMAIL_ID = 'emailBtn';
var COMBO_TYPE_ID = 'typeField';
var CHECK_ANON_ID = 'anonymousInput';
var INPUT_MESSAGE_ID = 'messageField';
var BTN_SUBMIT_ID = 'feedbackBtn';

var forumBtn = function() {  return element(by.id(BTN_FORUM_ID)); };
var chatBtn = function() {  return element(by.id(BTN_CHAT_ID)); };
var emailBtn = function() {  return element(by.id(BTN_EMAIL_ID)); };

var feedbackTypeSelector = function() {  return element(by.id(COMBO_TYPE_ID)); };
var feedbackAnonymousCheckbox = function() {  return element(by.id(CHECK_ANON_ID)); };
var feedbackMessageInput = function() {  return element(by.id()); };

var feedbackSubmitBtn = function() {  return element(by.id(BTN_SUBMIT_ID)); };

// Ensure that we are on the correct page
module.exports.verify = function() { 
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the Contact Us view
module.exports.get = function() {
  landing.get();
  landing.clickContactUsLink();
  
  module.exports.verify();
};

// Click the forum button (i.e. Google Group)
module.exports.clickForum = function() {
  forumBtn().click();
};

// Click the chat button (i.e. Gitter, Slack, etc)
module.exports.clickChat = function() {
  chatBtn().click();
};

// Click the email button
module.exports.toggleAnonymousCheckbox = function() {
  emailBtn().click();
};

// Make a selection in the Feedback Type dropdown
module.exports.selectFeedbackType = function(index) {
  /// TODO: How to interact with comboboxes?
};

// Click (toggle) the anonymous feedback checkbox
module.exports.clickEmail = function() {
  feedbackAnonymousCheckbox().click();
};

// Send text to the Feedback Message input
module.exports.enterFeedbackMessage = function(text) {
  feedbackMessageInput().sendKeys(text);
};

// Click the Submit Feedback button
module.exports.clickSubmitFeedback = function() {
  feedbackSubmitBtn().click();
};