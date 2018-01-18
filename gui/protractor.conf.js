var config = require("./protractor.auth.json");

// e2e.conf.js
exports.config = {
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  //chromeOnly: true,
  params: config,
  jasmineNodeOpts: { 
    defaultTimeoutInterval: 30000,
    realtimeFailure: true
  },
  
  /*
   * Specify the parameters of the browsers to test
   */
  multiCapabilities:[
    // Working on Windows and OSX
    { 'browserName': 'chrome' },
    
    // Firefox: 46.0.1 and below supposedly work, latest does not
    // See http://stackoverflow.com/questions/38644703/org-openqa-selenium-firefox-notconnectedexception-when-running-selenium-from-com
    //{ 'browserName': 'firefox' }, 
    
    // Safari: has not been tested
    // NOTE: OSX Only
    //{ 'browserName': 'safari' },
    
    // IE11: fails to connect to browser
    // NOTE: Windows Only
    // See https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/6511
    // { 'browserName': 'internet explorer', 'version': '11' }, 
  ],
  
  // Disable animations for testing
  onPrepare: function() {
    /* global angular: false, browser: false, jasmine: false */
    'use strict';
    
    /*var jasmineEnv = jasmine.getEnv();
     waitPlugin.setOnComplete(report);
     browser.driver.manage().window().maximize();
     browser.get(config.hostname);
 
     jasmineEnv.addReporter(new function () {
       this.specDone = function (spec) {
         if (spec.status !== 'failed') {
           var name = spec.fullName.replace(/ /g, '_');
           var reportfile = 'coverage/integration/json/' + name;
           reporter = new istanbul.Reporter(undefined, reportfile);
           var promise = browser.driver.executeScript('return __coverage__;')
                   .then(function (coverageResults) {
                     collector.add(coverageResults);
                   });
           waitPlugin.waitList.push(promise);
         }
       };
     });*/
    
    
    // Disable animations
    var disableNgAnimate = function() {
      angular.module('disableNgAnimate', []).run(['$animate', function($animate) {
        $animate.enabled(false);
      }]);
    };
    
    var disableCssAnimate = function() {
      angular
        .module('disableCssAnimate', [])
        .run(function() {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '* {' +
                // See http://stackoverflow.com/questions/26584451/how-to-disable-animations-in-protractor-for-angular-js-application
                // Disable CSS animation for e2e tests
                '-webkit-transition: none !important;' +
                '-moz-transition: none !important' +
                '-o-transition: none !important' +
                '-ms-transition: none !important' +
                'transition: none !important' +
                '}' +
    
                // See https://github.com/angular/protractor/issues/319
                // Disable sticky footer for e2e tests
                '#footer {' +
                'position: static;' +
                '}';
            document.getElementsByTagName('head')[0].appendChild(style);
        });
    };
    
    

    browser.addMockModule('disableNgAnimate', disableNgAnimate);
    browser.addMockModule('disableCssAnimate', disableCssAnimate);
  },
  
  /*
   * Specify which test spec(s) to run
   */
  suites: {
    landing: 'tests/e2e/landing.e2e.js',
    navbar: 'tests/e2e/navbar.e2e.js',
    swagger: 'tests/e2e/swagger.e2e.js',
    help: 'tests/e2e/help.e2e.js',
    
    signup: 'tests/e2e/signup.e2e.js',
    login: 'tests/e2e/login.e2e.js',
    reset: 'tests/e2e/reset.e2e.js',
    
    catalog: 'tests/e2e/catalog.e2e.js',
    addSpec: 'tests/e2e/addSpec.e2e.js',
    editSpec: 'tests/e2e/editSpec.e2e.js',
    dashboard: 'tests/e2e/dashboard.e2e.js',
    addService: 'tests/e2e/addService.e2e.js',
    editService: 'tests/e2e/editService.e2e.js',
    console: 'tests/e2e/console.e2e.js',
  }
}
