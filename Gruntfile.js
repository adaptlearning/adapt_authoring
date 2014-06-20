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
              src: ['frontend/src/core/libraries/require.js', 
                'frontend/src/core/libraries/modernizr.js', 
                'frontend/src/core/libraries/polyglot.min.js', 
                'frontend/src/core/libraries/jquery.jsoneditor.min.js',
                'frontend/src/core/libraries/jquery-ui.min.js',
                'frontend/src/core/libraries/jquery.form.js'],
              dest: 'frontend/build/libraries/',
              filter: 'isFile',
              flatten: true
            },
            {
              expand: true,
              flatten: true,
              src: ['frontend/src/**/assets/**'],
              dest: 'frontend/build/adaptbuilder/css/assets/',
              filter: 'isFile'
            },
            {
              expand: true,
              flatten: false,
              src: ['*/**'],
              dest: 'frontend/build/libraries/tinymce/',
              cwd: 'frontend/src/core/libraries/tinymce/'
            }
          ]
        }
      },
      less: {
        dist: {
          files: [
            {
              'frontend/build/adaptbuilder/css/kube.min.css': 'frontend/src/less/kube.less'
            },
            {
              'frontend/build/adaptbuilder/css/adapt.css': 'frontend/src/core/**/*.less'
            }
          ]
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
            "frontend/src/templates/templates.js": "frontend/src/core/**/*.hbs"
          }
        }
      },
      requirejs: {
        dev: {
          options: {
            name: "core/app/app",
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
            name: "core/app/app",
            baseUrl: "frontend/src",
            mainConfigFile: "./config.js",
            out: "./frontend/build/adaptbuilder/js/adaptbuilder.min.js",
            optimize:"uglify2"
          }
        }
      },
      watch: {
        handlebars: {
          files: ['frontend/src/**/*.hbs'],
          tasks: ['handlebars', 'compile']
        },
        js: {
          files: [
            'frontend/src/**/*.js',
            '!frontend/src/templates/templates.js'
          ],
          tasks: ['compile']
        },
        less: {
          files: ['frontend/src/**/*.less'],
          tasks: ['less']
        },
        routes: {
          files: ['routes/**/*.*'],
          tasks: ['compile']
        }
      },
      mochaTest: {
        test: {
          options: {
            reporter: 'dot',
            timeout: 3500,
            require: ['should'],
            ui: 'bdd',
            globals: ['app']
          },
          src: [
            'test/*.js'
          ]
        }
      },
      open: {
        server: {
          path: 'http://localhost:<%= server.options.port %>/'
        }
      },
      server: {
        options: {
          port: getHttpPort() || 3000
        }
      }
    });

    function getHttpPort() {
      if (grunt.file.exists(__dirname + "/conf/config.json")) {
          var config = require(__dirname + "/conf/config.json");
          return config.serverPort;
      } else {
        return false;
      }
    };

    grunt.registerTask('default',['less', 'handlebars', 'watch']);
    grunt.registerTask('build',['less', 'copy', 'handlebars', 'requirejs:compile']);
    grunt.registerTask('dev',['less', 'copy', 'handlebars', 'requirejs:dev']);
    grunt.registerTask('test',['mochaTest']);
    grunt.registerTask('compile',['requirejs:dev']);
    grunt.registerTask('server',['less', 'handlebars', 'compile', 'start', 'open:server', 'watch']);
    grunt.registerTask('start', 'Start node server', function() {
      var server = require('./server');
    });
};
