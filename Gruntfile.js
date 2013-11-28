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
              src: ['src/core/js/scriptLoader.js'], 
              dest: 'build/adaptbuilder/js/', 
              filter: 'isFile', 
              flatten: true
            },
            {
              expand: true, 
              src: ['src/core/js/libraries/require.js', 'src/core/js/libraries/modernizr.js'], 
              dest: 'build/libraries/', 
              filter: 'isFile', 
              flatten: true
            },
            {
              expand: true,
              src: ['src/data/*'],
              dest: 'build/data/',
              filter: 'isFile', 
              flatten: true
            },
          ]
        }
      },
      less: {
        dist: {
          files: {
            'build/adaptbuilder/css/adapt.css': 'src/**/*.css'
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
            "src/templates/templates.js": "src/**/*.hbs"
          }
        }
      },
      requirejs: {
        dev: {
          options: {
            name: "core/js/app",
            baseUrl: "src",
            mainConfigFile: "./config.js",
            out: "./build/adaptbuilder/js/adaptbuilder.min.js",
            generateSourceMaps: true,
            preserveLicenseComments:false,
            optimize: "none"
          }
        },
        compile: {
          options: {
            name: "core/js/app",
            baseUrl: "src",
            mainConfigFile: "./config.js",
            out: "./build/adaptbuilder/js/adaptbuilder.min.js",
            optimize:"uglify2"
          }
        }
      },
      watch: {
        files: ['src/**/*.hbs'],
        tasks: ['handlebars']
      }
    });
    
    grunt.registerTask('default',['less', 'handlebars', 'watch']);
    grunt.registerTask('build',['less', 'copy', 'handlebars']);
    grunt.registerTask('dev',['less', 'copy', 'handlebars', 'requirejs:dev']);
};