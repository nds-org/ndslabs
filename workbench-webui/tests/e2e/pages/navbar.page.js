/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

module.exports = {};

var Navbar = function() {
  "use strict";

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

Navbar.prototype.clickBrandNav = function() {  
  "use strict";

  this.brandNav.click();
};

Navbar.prototype.expandHelpDropdown = function() {  
  "use strict";

  this.helpDropdown.click();
};

Navbar.prototype.clickHelpLink = function(index) {  
  "use strict";

  this.helpLink(index).click();
};

Navbar.prototype.clickApiReferenceNav = function() {  
  "use strict";

  this.apiReferenceNav.click();
};

Navbar.prototype.clickContactUsNav = function() {  
  "use strict";

  this.contactUsNav.click();
};

  
Navbar.prototype.clickSignIn = function() {  
  "use strict";

  this.signinNav.click();
};

Navbar.prototype.clickSignUp = function() {  
  "use strict";

  this.signupNav.click();
};

  
Navbar.prototype.clickApplicationsNav = function() {  
  "use strict";

  this.applicationsNav.click();
};

Navbar.prototype.clickCatalogNav = function() {  
  "use strict";

  this.catalogNav.click();
};

Navbar.prototype.clickFilesNav = function() {  
  "use strict";

  this.filesNav.click();
};

Navbar.prototype.expandAccountDropdown = function() {  
  "use strict";

  this.accountDropdown.click();
};

Navbar.prototype.clickChangePasswordNav = function() {  
  "use strict";

  this.changePasswordNav.click();
};

Navbar.prototype.clickSignOut = function() {  
  "use strict";

  this.logoutBtn.click();
};

/**
 * Insert public Getter functions here for user interactions
 */

module.exports = Navbar;