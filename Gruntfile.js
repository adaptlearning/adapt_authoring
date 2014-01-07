module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  
  // Project configuration.
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      copy: {
        main: {
          files: [
            {
              expand: true, 
              src: ['frontend/src/core/js/scriptLoader.js'], 
              dest: 'frontend/build/adaptbuilder/js/', 
              filter: 'isFile', 
              flatten: true
            },
            {
              expand: true, 
              src: ['frontend/src/core/js/libraries/require.js', 'frontend/src/core/js/libraries/modernizr.js'], 
              dest: 'frontend/build/libraries/', 
              filter: 'isFile', 
              flatten: true
            },
            {
              expand: true,
              src: ['frontend/src/data/*'],
              dest: 'frontend/build/data/',
              filter: 'isFile', 
              flatten: true
            },
          ]
        }
      },
      less: {
        dist: {
          files: {
            'frontend/build/adaptbuilder/css/adapt.css': 'frontend/src/**/*.css'
          }
        },
        options: {
          compress: true
        }
      },
      handlebars: {
        compile: {
          options: {
            namespace:"Handlebars.templates",
            processName: function(filePath) {
              var newFilePath = filePath.split("/");
              newFilePath = newFilePath[newFilePath.length - 1].replace(/\.[^/.]+$/, "");
              return  newFilePath;
            },
            partialRegex: /^part_/,
            partialsPathRegex: /\/partials\//
          },
          files: {
            "frontend/src/templates/templates.js": "frontend/src/**/*.hbs"
          }
        }
      },
      requirejs: {
        dev: {
          options: {
            name: "core/js/app",
            baseUrl: "frontend/src",
            mainConfigFile: "./config.js",
            out: "./frontend/build/adaptbuilder/js/adaptbuilder.min.js",
            generateSourceMaps: true,
            preserveLicenseComments:false,
            optimize: "none"
          }
        },
        compile: {
          options: {
            name: "core/js/app",
            baseUrl: "frontend/src",
            mainConfigFile: "./config.js",
            out: "./frontend/build/adaptbuilder/js/adaptbuilder.min.js",
            optimize:"uglify2"
          }
        }
      },
      watch: {
        files: ['frontend/src/**/*.hbs'],
        tasks: ['handlebars']
      }
    });
    
    grunt.registerTask('default',['less', 'handlebars', 'watch']);
    grunt.registerTask('build',['less', 'copy', 'handlebars']);
    grunt.registerTask('dev',['less', 'copy', 'handlebars', 'requirejs:dev']);
};