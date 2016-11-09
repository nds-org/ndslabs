/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {};

var Navbar = function() {
  // Always visible
  this.brandNav = element(by.id('navbarBrand'));
  
  // Account dropdown (always visible)
  this.helpDropdown = element(by.id('helpDropdown'));
  this.helpLink = function(index) {  return element(by.id('helpLink' + index + 'Nav')); };
  this.apiReferenceNav = element(by.id('apiNav'));
  this.contactUsNav = element(by.id('contactUsNav'));

  // Non-auth
  this.signupNav = element(by.id('signupNav'));
  this.signinNav = element(by.id('signinNav'));
  
  // Auth-only
  this.applicationsNav = element(by.id('applicationsNav'));
  this.catalogNav = element(by.id('catalogNav'));
  this.filesNav = element(by.id('filesNav'));
  
  // Account dropdown (auth-only)
  this.accountDropdown = element(by.id('accountDropdown'));
  this.changePasswordNav = element(by.id('resetPasswordNav'));
  this.logoutBtn = element(by.id('logoutBtn'));
};

Navbar.prototype.clickBrandNav = function() {  this.brandNav.click(); };
Navbar.prototype.expandHelpDropdown = function() {  this.helpDropdown.click(); };
Navbar.prototype.clickHelpLink = function(index) {  this.helpLink(index).click(); };
Navbar.prototype.clickApiReferenceNav = function() {  this.apiReferenceNav.click(); };
Navbar.prototype.clickContactUsNav = function() {  this.contactUsNav.click(); };
  
Navbar.prototype.clickSignIn = function() {  this.signinNav.click(); };
Navbar.prototype.clickSignUp = function() {  this.signupNav.click(); };
  
Navbar.prototype.clickApplicationsNav = function() {  this.applicationsNav.click(); };
Navbar.prototype.clickCatalogNav = function() {  this.catalogNav.click(); };
Navbar.prototype.clickFilesNav = function() {  this.filesNav.click(); };
Navbar.prototype.expandAccountDropdown = function() {  this.accountDropdown.click(); };
Navbar.prototype.clickChangePasswordNav = function() {  this.changePasswordNav.click(); };
Navbar.prototype.clickSignOut = function() {  this.logoutBtn.click(); };

/**
 * Insert public Getter functions here for user interactions
 */

module.exports = Navbar;