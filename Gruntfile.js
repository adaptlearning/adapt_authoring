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
              flatten: true,
              src: ['frontend/src/core/**/assets/**'],
              dest: 'frontend/src/adaptbuilder/css/assets/',
              filter: 'isFile'
            }
          ]
        }
      },
      less: {
        dist: {
          files: [
            {
              'frontend/src/adaptbuilder/css/kube.min.css': 'frontend/src/less/kube.less'
            },
            {
              'frontend/src/adaptbuilder/css/adapt.css': 'frontend/src/core/**/*.less'
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
      watch: {
        handlebars: {
          files: ['frontend/src/**/*.hbs'],
          tasks: ['handlebars']
        },
        less: {
          files: ['frontend/src/**/*.less'],
          tasks: ['less']
        },
        routes: {
          files: ['routes/**/*.*'],
          tasks: ['handlebars']
        }
      },
      casperjs: {
        files: ['./test_frontend/*.js', '!./test_frontend/login.js']
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
    grunt.registerTask('test-ui', ['casperjs']);
    grunt.registerTask('compile',['requirejs:dev']);
    grunt.registerTask('server',['copy', 'less', 'handlebars', 'start', 'open:server', 'watch']);
    grunt.registerTask('start', 'Start node server', function() {
      var server = require('./server');
    });
};
