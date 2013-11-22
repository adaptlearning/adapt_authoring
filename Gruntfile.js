module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  });

  // Default task(s).
  grunt.registerTask('default', 'Log some stuff.', function() {
    grunt.log.write('No default tasks defined for Grunt yet...').ok();
  });
};