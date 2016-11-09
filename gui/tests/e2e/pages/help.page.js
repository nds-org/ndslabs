/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';

module.exports = {};

// Load other modules
var helpers = require('../helpers.e2e.js');

var LandingPage = require('./landing.page.js');

var PAGE_TITLE = 'Contact Labs Workbench Support';
var PAGE_ROUTE = /https\:\/\/.+\/\#\/contact/;

var ContactUsPage = function() {
  this.forumBtn = element(by.id('ggroupBtn'));
  this.chatBtn = element(by.id('gitterBtn'));
  this.emailBtn = element(by.id('emailBtn'));
  
  this.feedbackTypeSelector = element(by.id('typeField'));
  this.feedbackAnonymousCheckbox = element(by.id('anonymousInput'));
  this.feedbackMessageInput = element(by.id('messageField'));
  
  this.feedbackSubmitBtn = element(by.id('feedbackBtn'));
};

// Navigate to the Contact Us view
ContactUsPage.prototype.get = function() {
  var landingPage = new LandingPage();
  
  landingPage.get();
  landingPage.clickContactUsLink();
  
  this.verify();
};

// Ensure that we are on the correct page
ContactUsPage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Click the forum button (i.e. Google Group)
ContactUsPage.prototype.clickForum = function() {
  this.forumBtn.click();
};

// Click the chat button (i.e. Gitter, Slack, etc)
ContactUsPage.prototype.clickChat = function() {
  this.chatBtn.click();
};

// Click the email button
ContactUsPage.prototype.clickEmail = function() {
  this.emailBtn.click();
};

// Make a selection in the Feedback Type dropdown
// TODO: Can this be done without using the index?
ContactUsPage.prototype.selectFeedbackType = function(index) {
  helpers.selectDropdownbyNum(this.feedbackTypeSelector, index);
};

// Click (toggle) the anonymous feedback checkbox
ContactUsPage.prototype.toggleAnonymousCheckbox = function() {
  this.feedbackAnonymousCheckbox.click();
};

// Send text to the Feedback Message input
ContactUsPage.prototype.enterFeedbackMessage = function(text) {
  this.feedbackMessageInput.sendKeys(text);
};

// Click the Submit Feedback button
ContactUsPage.prototype.clickSubmitFeedback = function() {
  this.feedbackSubmitBtn.click();
};

module.exports = ContactUsPage;