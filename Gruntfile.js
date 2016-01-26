// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
module.exports = function(grunt) {
  require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      "merge-json": {
        en: {
            src: ['routes/lang/en-application.json','frontend/src/plugins/**/lang/en.json'],
            dest: 'routes/lang/en.json',
        }
      },
      copy: {
        main: {
          files: [
            {
              expand: true,
              flatten: true,
              src: ['frontend/src/core/**/assets/**','frontend/src/plugins/**/assets/**'],
              dest: 'frontend/src/adaptbuilder/css/assets/',
              filter: 'isFile'
            },
            {
              expand: true,
              cwd: 'frontend/src/core/libraries/tinymce/',
              src: ['plugins/**/*', 'skins/**/*', 'themes/**/*'],
              dest: 'frontend/src/adaptbuilder/js/'
            },
            {
              expand: true,
              flatten: true,
              src: ['frontend/src/core/libraries/ace/**/*'],
              dest: 'frontend/src/adaptbuilder/js/ace'
            }
          ]
        }
      },
      less: {
        dist: {
          files: [
            {
              'frontend/src/adaptbuilder/css/adapt.css': [
                'frontend/src/core/**/*.less',
                'frontend/src/less/**/*.less',
                'frontend/src/plugins/**/*.less'
              ]
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
            "frontend/src/templates/templates.js": ["frontend/src/core/**/*.hbs", "frontend/src/plugins/**/*.hbs"]
          }
        }
      },
      jscs: {
        src: ['frontend/src/core/**/*.js','!frontend/src/core/libraries/**/*.js','lib/**/*.js','plugins/**/*.js','!plugins/content/**','routes/**/*.js','!**/node_modules/**'],
        options: {
          config: ".jscsrc",
          reporter: "unix",
          fix: true
        }
      },
      jshint: {
        options: {
          reporter: require('jshint-stylish'),
          curly: true,
          undef: true,
          asi: true,
          eqnull: false,
          sub: true
        },
        frontend: {
          options: {
            browser: true,
            es3: true,
            jquery: true,
            globals: {
              Backbone: false,
              Handlebars: false,
              _: false,
              define: false,
              require: false
            }
          },
          files: {
            src: ['frontend/src/core/**/*.js','!frontend/src/core/libraries/**/*.js']
          }
        },
        backend: {
          options: {
            node: true
          },
          files: {
            src: ['lib/**/*.js','plugins/**/*.js','!plugins/content/**','routes/**/*.js','!**/node_modules/**']
          }
        }
      },
      requirejs: {
        dev: {
          options: {
            name: "core/app/app",
            mainConfigFile: "frontend/src/core/app/config.js",
            out: "frontend/src/adaptbuilder/js/origin.js",
            generateSourceMaps: true,
            preserveLicenseComments:true,
            include: ['core/app/config'],
            optimize: "none"
          }
        },
        compile: {
          options: {
            name: "core/app/app",
            mainConfigFile: "frontend/src/core/app/config.js",
            out: "frontend/src/adaptbuilder/js/origin.js",
            include: ['core/app/config'],
            optimize:"uglify2"
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
          port: getHttpPort() || process.env.PORT
        }
      },
      requirePlugins: {
        url: 'frontend/src/plugins/*',
        dest: 'frontend/src/plugins'
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

    grunt.registerTask('build', 'Running build', function(mode) {
      // To toggle compilation call either:
      // grunt build:prod - or
      // grunt build:dev
      var configFile = 'conf/config.json';

      if (grunt.file.exists(configFile)) {
        var config = grunt.file.readJSON(configFile);

        // Check if we're in 'production' mode
        config.isProduction = (mode === 'prod')
                              ? true
                              : false;

        var compilation = (config.isProduction)
                          ? 'compile'
                          : 'dev';

        // Save the configuration
        grunt.file.write(configFile, JSON.stringify(config, null, 2));

        grunt.task.run(['requirePlugins', 'merge-json', 'copy', 'less', 'handlebars', 'requirejs:'+ compilation]);
      } else {
        grunt.task.run(['requirePlugins', 'copy', 'less', 'handlebars', 'requirejs:dev']);
      }
    });

    grunt.registerTask('server', "Running Server", function() {
      grunt.task.run(['requirePlugins', 'copy', 'less', 'handlebars', 'open:server', 'watch']);
    });

    // Compiles frontend plugins
    grunt.registerTask('requirePlugins', 'Compiling plugins', function() {

      var config = grunt.config.get('requirePlugins');
      var requirePaths = '';

      // Go through each subfolder in the plugins directory
      var foldersArray = grunt.file.expand({filter: "isDirectory"}, config.url);

      // Check if any plugins are available
      if (foldersArray.length === 0) {
        requirePaths += "'";
      }
      foldersArray.forEach(function(path, index, folders) {

        // Strip off front of path to make relative path to config file
        var relativePath = path.replace('frontend/src', '');
        var splitter = "','";

        if (index === folders.length - 1) {
            splitter = "'"
        }

        requirePaths += relativePath + '/index.js' + splitter;


      });

      var requireStatement = "require(['" + requirePaths +"]);";
      grunt.file.write(config.dest + '/plugins.js', requireStatement);

    });

    grunt.registerTask('default',['requirePlugins', 'less', 'handlebars', 'watch']);
    grunt.registerTask('test',['mochaTest']);
    grunt.registerTask('test-ui', ['casperjs']);

};
