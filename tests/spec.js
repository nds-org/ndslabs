"use strict"

// spec.js
describe('Labs Workbench Landing Page', function() {
  var ptor;

  beforeEach(function() {
    var url = 'https://www.mldev.ndslabs.org/';
//    var url = 'https://www.workbench.nationaldataservice.org/';

    browser.driver.manage().window().setSize(1280, 1024);

    browser.get(url);
  });

  it('should have a title', function() {
    expect(browser.getTitle()).toEqual('Labs Workbench Landing Page');
  });

  it('should offer sign-up', function() {
    element(by.id('signUpBtn')).click();
  });

  it('should offer sign-in', function() { 
    element(by.id('signInBtn')).click();
  });
});
