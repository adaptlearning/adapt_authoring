// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
module.exports = function(grunt) {
  require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    "merge-json": {
      en: {
        src: [
          'routes/lang/en-application.json',
          'frontend/src/**/lang/en.json'
        ],
        dest: 'routes/lang/en.json'
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            src: [
              'frontend/src/core/**/assets/**',
              'frontend/src/modules/**/assets/**',
              'frontend/src/plugins/**/assets/**',
              'frontend/src/libraries/**/assets/**'
            ],
            dest: 'frontend/build/css/assets/',
            filter: 'isFile'
          },
          {
            expand: true,
            flatten: true,
            src: ['frontend/src/libraries/ace/*'],
            dest: 'frontend/build/js/ace'
          }
        ]
      }
    },
    less: {
      dev: {
        options: {
          baseUrl: 'frontend/src',
          src: [
            'frontend/src/core/**/*.less',
            'frontend/src/modules/**/*.less',
            'frontend/src/plugins/**/*.less',
            'frontend/src/libraries/**/*.less'
          ],
          paths: 'frontend/src/core/less',
          generateSourceMaps: true,
          compress: false,
          dest: 'frontend/build/css',
          cssFilename: 'adapt.css',
          mapFilename: 'adapt.css.map'
        }
      },
      compile: {
        options: {
          baseUrl: 'frontend/src',
          src: [
            'frontend/src/core/**/*.less',
            'frontend/src/less/**/*.less',
            'frontend/src/modules/**/*.less',
            'frontend/src/plugins/**/*.less',
            'frontend/src/libraries/**/*.less'
          ],
          paths: 'frontend/src/core/less',
          generateSourceMaps: false,
          compress: true,
          dest: 'frontend/build/css',
          cssFilename: 'adapt.css',
          mapFilename: 'adapt.css.map'
        }
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
          "frontend/src/templates/templates.js": [
            "frontend/src/core/**/*.hbs",
            "frontend/src/modules/**/*.hbs",
            "frontend/src/plugins/**/*.hbs"
          ]
        }
      }
    },
    jscs: {
      src: [
        'frontend/src/core/**/*.js',
        'frontend/src/modules/**/*.js',
        '!frontend/src/libraries/**/*.js',
        'lib/**/*.js',
        'plugins/**/*.js',
        '!plugins/content/**',
        'routes/**/*.js',
        '!**/node_modules/**'
      ],
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
          src: [
            'frontend/src/core/**/*.js',
            'frontend/src/modules/**/*.js',
            '!frontend/src/libraries/**/*.js'
          ]
        }
      },
      backend: {
        options: {
          node: true
        },
        files: {
          src: [
            'lib/**/*.js',
            'plugins/**/*.js',
            '!plugins/content/**',
            'routes/**/*.js',
            '!**/node_modules/**'
          ]
        }
      }
    },
    requirejs: {
      dev: {
        options: {
          baseUrl: 'frontend/src',
          name: 'core/app',
          mainConfigFile: "frontend/src/core/config.js",
          out: "frontend/build/js/origin.js",
          generateSourceMaps: true,
          preserveLicenseComments: true,
          optimize: "none"
        }
      },
      compile: {
        options: {
          baseUrl: 'frontend/src',
          name: 'core/app',
          mainConfigFile: "frontend/src/core/config.js",
          out: "frontend/build/js/origin.js",
          optimize: "uglify2"
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
        tasks: ['less:dev']
      },
      routes: {
        files: ['routes/**/*.*'],
        tasks: ['handlebars']
      },
      lang: {
        files: ['routes/lang/*.json'],
        tasks: ['merge-json']
      }
    },
    mochaTest: {
      src: ['test/*.js'],
      options: {
        reporter: 'spec',
        timeout: 3500
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
    requireBundle: {
      modules: {
        src: 'frontend/src/modules/*',
        dest: 'frontend/src/modules/modules.js'
      },
      plugins: {
        src: 'frontend/src/plugins/*',
        dest: 'frontend/src/plugins/plugins.js'
      }
    }
  });

  function getHttpPort() {
    if (!grunt.file.exists(__dirname + "/conf/config.json")) {
      return false;
    }
    var config = require(__dirname + "/conf/config.json");
    return config.serverPort;
  };

  /**
  * Accepts 'build' and 'prod' params
  * e.g. grunt build:prod
  */
  grunt.registerTask('build', 'Running build', function(mode) {
    var configFile = 'conf/config.json';

    if (!grunt.file.exists(configFile)) {
      return grunt.task.run(['requireBundle', 'copy', 'less:dev', 'handlebars', 'requirejs:dev']);
    }
    var config = grunt.file.readJSON(configFile);
    // Check if we're in 'production' mode
    config.isProduction = (mode === 'prod') ? true : false;
    // Save the configuration
    grunt.file.write(configFile, JSON.stringify(config, null, 2));
    // run the tasks
    var compilation = (config.isProduction) ? 'compile' : 'dev';
    grunt.task.run(['requireBundle', 'merge-json', 'copy', 'less:' + compilation, 'handlebars', 'requirejs:'+ compilation]);
  });

  grunt.registerTask('server', "Running Server", function() {
    grunt.task.run(['requireBundle', 'copy', 'less:dev', 'handlebars', 'open:server', 'watch']);
  });

  // Compiles frontend plugins
  grunt.registerMultiTask('requireBundle', 'Generates a .js file with a bunch of imports for the path files', function() {
    var modulePaths = '';
    // Go through each subfolder in the plugins directory
    var foldersArray = grunt.file.expand({ filter: "isDirectory" }, this.data.src);
    // Check if any plugins are available
    if (foldersArray.length === 0) {
      modulePaths += "'";
    }
    foldersArray.forEach(function(path, index, folders) {
      // Strip off front of path to make relative path to config file
      var relativePath = path.replace(grunt.config.get('requirejs').dev.options.baseUrl, '').slice(1);
      var splitter = "','";
      if (index === folders.length - 1) splitter = "'";
      modulePaths += relativePath + '/index' + splitter;
    });
    grunt.file.write(this.data.dest, "define(['" + modulePaths +"], function() {});");
  });

  grunt.registerMultiTask('less', 'Compile Less files to CSS', function() {
    var path = require('path');
    var less = require('less');
    var options = this.options({});
    var shouldGenerateSourceMaps = options.generateSourceMaps;
    var destination = options.dest;
    var mapFilename = options.mapFilename;
    var imports = getImports();
    var lessOptions = getLessOptions();
    var sourceMapPath = path.join(destination, mapFilename);
    var importsPath = sourceMapPath + '.imports';
    var done = this.async();

    if (!shouldGenerateSourceMaps) removeSourceMaps();

    less.render(imports, lessOptions, complete);

    function getImports() {
      var src = options.src;
      var ret = '';

      for (var i = 0, l = src.length; i < l; i++) {
        grunt.file.expand({ filter: options.filter }, src[i]).forEach(function(lessPath) {
          ret += '@import \'' + path.normalize(lessPath) + '\';\n';
        });
      }
      return ret;
    }

    function getLessOptions() {
      var ret = {
        compress: options.compress,
        paths: options.paths
      };
      if (shouldGenerateSourceMaps) {
        ret.sourceMap = {
          'sourceMapFileInline': false,
          'outputSourceFiles': true,
          'sourceMapBasepath': 'src',
          'sourceMapURL': mapFilename
        };
      }
      return ret;
    }

    function removeSourceMaps() {
      if (grunt.file.exists(sourceMapPath)) {
        grunt.file.delete(sourceMapPath, { force: true });
      }
      if (grunt.file.exists(importsPath)) {
        grunt.file.delete(importsPath, { force: true });
      }
    }

    function complete(error, output) {
      if (error) return grunt.fail.fatal(JSON.stringify(error, false, ' '));

      var outputMap = output.map;

      if (outputMap) {
        grunt.file.write(sourceMapPath, outputMap);
        grunt.file.write(importsPath, imports);
      }
      grunt.file.write(path.join(destination, options.cssFilename), output.css);
      done();
    }
  });

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['merge-json', 'requireBundle', 'less:dev', 'handlebars', 'watch']);
};
