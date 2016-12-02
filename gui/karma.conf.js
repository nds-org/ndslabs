// Karma configuration
// Generated on Mon Oct 31 2016 19:43:20 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	// See http://stackoverflow.com/questions/19117092/jasmine-tests-in-karma-uncaught-referenceerror-require-is-not-defined
    frameworks: ['jasmine'/*, 'browserify'*/],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
  	  'bower_components/jquery/dist/jquery.min.js',
  	  'bower_components/bootstrap/dist/js/bootstrap.min.js',
  	  'bower_components/lodash/dist/lodash.min.js',
  	  'bower_components/angular-route/angular-route.min.js',
  	  'bower_components/angular-resource/angular-resource.min.js',
  	  'bower_components/angular-animate/angular-animate.min.js',
  	  'bower_components/angular-cookies/angular-cookies.min.js',
  	  'bower_components/angular-messages/angular-messages.min.js',
  	  'bower_components/angular-sanitize/angular-sanitize.min.js',
  	  'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
  	  'bower_components/angular-swagger-ui/dist/scripts/swagger-ui.js',
  	  'bower_components/term.js/src/term.js',
  	  'bower_components/angular-bootstrap-pwgen/angular-bootstrap-pwgen.js',
  	  'bower_components/ng-password-strength/dist/scripts/ng-password-strength.js',
  	  'bower_components/angular-clipboard/angular-clipboard.js',
  	  'bower_components/ng-tags-input/ng-tags-input.min.js',
  	  'bower_components/angular-gravatar/build/angular-gravatar.js',
  	  'bower_components/angular-busy/dist/angular-busy.js',
  	  'bower_components/angular-wizard/angular-wizard.js',
  	  'bower_components/angular-grid/angular-grid.js',
  	  'bower_components/angular-alert/angular-alert.js',
      'app/shared/api.js',
      'app/shared/*.js',
      'app/shared/**/*.js',
      'app/*.js',          // Module definitions
	    'app/**/*.js',       // View controllers
	    'app/**/**/*.js',    // Subview controllers
	    'app/**/**/**/*.js', // Modal controllers
      'tests/unit/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
  	  'app/api/swagger.js',
  	  'app/api/jsonify.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
	// See http://stackoverflow.com/questions/19117092/jasmine-tests-in-karma-uncaught-referenceerror-require-is-not-defined
    preprocessors: {
	//	'app/tests/*.js': [ 'browserify' ],
		  'app/login/signUp/*.js': 'coverage'
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage', 'html'],
	
  	htmlReporter: {
  	  outputFile: 'tests/reports/unit.html'
  	},
 
    coverageReporter: {
      type : 'html',
      dir : 'tests/reports/coverage/'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}

