module.exports = function(grunt) {

  // Display the elapsed execution time of grunt tasks
  require('time-grunt')(grunt);
  // Load all grunt-* packages from package.json
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    
    // configure grunt to execute jshint
    jshint: {
      files: ['Gruntfile.js', 'app/**/*.js', 'tests/**/*.js'],
      options: {
        ignores: ['node_modules/**/*', 'bower_components/**/*', 'tests/reports/**/*'],
        reporterOutput: "",
        force: true,
        esversion: 6,
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
    
    cssmin: {
      options:{
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'dist/main.min.css': [ 'asset/css/purple-primary.css', 'asset/css/font-roboto.css', 'asset/css/suppl.css', 'asset/css/animations.css' ]
        }
      }
    },
    
    // configure grunt to minify js / css
    uglify: {
      options: {
          compress: true,
          mangle: true,
          //sourceMap: true,
          //sourceMapIncludeSources: true,
          //sourceMapIn: 'dist/main.js.map',
      },
      target: {
          src: [
            'app/app.js',
            'app/api/SwaggerController.js',
            'app/catalog/**/*.js',
            'app/dashboard/**/*.js',
            'app/help/**/*.js',
            'app/landing/**/*.js',
            'app/login/*.js',
            'app/shared/*.js',
            'app/shared/**/*.js'
          ],
          dest: 'dist/main.min.js'
      }
    },
    
    // configure grunt to start the ExpressJS server
    express: {
      options: {
        script: 'server.js'
      },
      dev: {
        options: {
          script: 'server.js'
        }
      }
    },
    
    // configure grunt to run karma unit tests + coverage
	  karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true,        // Stop after running once?
        autoWatch: false,       // Auto-run tests when files change on disk?
        background: false,      // Prevent this task from blocking subsequent tasks?
      }
	  },
	  
	  // configure grunt to run protractor e2e tests + coverage
	  // protractor_coverage: {
	  protractor: {
      options: {
        configFile: "node_modules/protractor/example/conf.js", // Default config file 
        keepAlive: false, // If false, the grunt process stops when the test fails. 
        noColor: false, // If true, protractor will not use colors in its output. 
      },
      ndslabs: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too. 
        options: {
          configFile: "e2e.conf.js", // Target-specific config file 
          args: {} // Target-specific arguments 
        }
      },
	  },
	  
	  // configure grunt to generate a coverage report from istanbul
	  /*makeReport: {
      src: 'path/to/coverage/dir/*.json',
      options: {
          type: 'lcov',
          dir: 'path/to/coverage/dir',
          print: 'detail'
      }
    },*/
  });

  //grunt.loadNpmTasks('grunt-auto-install');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-protractor-runner');

  // Adjust task execution order here
  grunt.registerTask('default', [ 'jshint', 'cssmin', 'uglify', 'express', /*'karma', 'protractor'*/ ]);

};
