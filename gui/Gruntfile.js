module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'app/**/*.js', 'tests/**/*.js'],
      options: {
        ignores: ['node_modules/**/*', 'bower_components/**/*', 'tests/reports/**/*'],
        reporterOutput: "",
        globals: {
          //jQuery: true,     // jQuery
          window: true,     // JavaScript
          Buffer: true,     // JavaScript?
          
          require: true,    // nodejs
          
          angular: true,    // angular
          
          module: true,     // angular-mocks
          inject: true,     // angular-mocks
          
          describe: true,   // jasmine
          it: true,         // jasmine
          beforeAll: true,  // jasmine
          beforeEach: true, // jasmine
          afterEach: true,  // jasmine
          afterAll: true,   // jasmine
          expect: true,     // jasmine
          element: true,    // jasmine
          
          browser: true,    // protractor
          by: true,         // protractor
        }
      }
    },
    auto_install: {
      local: {
        stdout: true,
        stderr: true,
        failOnError: true,
        npm: true,
        bower: true
      },
    },
	  karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true,
        autoWatch: false
      }
	  },
	  protractor: {
      options: {
        configFile: "node_modules/protractor/example/conf.js", // Default config file 
        keepAlive: false, // If false, the grunt process stops when the test fails. 
        noColor: false, // If true, protractor will not use colors in its output. 
        args: {} // Arguments passed to the command 
      },
      your_target: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too. 
        options: {
          configFile: "e2e.conf.js", // Target-specific config file 
          args: {} // Target-specific arguments 
        }
      },
	  },
  });

  grunt.loadNpmTasks('grunt-auto-install');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-karma');
  //grunt.loadNpmTasks('grunt-protractor-runner');

  // grunt=karma fails with "Warning: Task "grunt-karma" not found. Use --force to continue."
  grunt.registerTask('default', ['auto_install', 'jshint', /*'grunt-karma', 'grunt-protractor-runner'*/ ]);

};
