/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

// Footer links
var Footer = function() {
  "use strict";

  this.apiVersion = element(by.id('apiVersion'));
  this.guiVersion = element(by.id('guiVersion'));
  this.supportEmailLink = element(by.id('supportEmailLink'));
  this.uIllinoisLink = element(by.id('uIllinoisLink'));
};

/**
 * Insert public Getter functions here for user interactions
 */

module.exports = Footer;