// conf.js
exports.config = {
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  chromeOnly: true,
  capabilities: {
	  'browsername': 'chrome'
  },
  
  /*
   * Specify the parameters of the browsers to test
   */
  /* multiCapabilities:[
	{
	  'browserName': 'firefox'
	}, {
	  'browserName': 'chrome'
	},{
	  'browserName': 'internet explorer',
      'version': '11'
	}
  ],*/
  
  /*
   * Specify which test spec(s) to run
   */
  specs: ['tests/spec.js']
}
