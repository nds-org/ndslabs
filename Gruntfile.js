module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          angular: true,
          jQuery: true,
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
	  protractor: {
		options: {
		  configFile: "node_modules/protractor/example/conf.js", // Default config file 
		  keepAlive: false, // If false, the grunt process stops when the test fails. 
		  noColor: false, // If true, protractor will not use colors in its output. 
		  args: {
			// Arguments passed to the command 
		  }
		},
		your_target: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too. 
		  options: {
			configFile: "e2e.conf.js", // Target-specific config file 
			args: {} // Target-specific arguments 
		  }
		},
	  },
	  karma: {
		unit: {
			configFile: 'karma.conf.js'
			singleRun: true,
			autoWatch: false
		}
	  }
    },
  });

  grunt.loadNpmTasks('grunt-auto-install');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-protractor-runner');

  grunt.registerTask('default', ['auto_install', 'jshint', 'grunt-karma' /*, 'grunt-protractor-runner' */]);

};
