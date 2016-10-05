module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          jQuery: true
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
        
      }
    },
  });

  grunt.loadNpmTasks('grunt-auto-install');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['auto_install', 'jshint']);

};
