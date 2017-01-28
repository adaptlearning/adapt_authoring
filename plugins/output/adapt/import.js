// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var archiver = require('archiver');
var async = require('async');
var fs = require("fs-extra");
var path = require("path");
var IncomingForm = require('formidable').IncomingForm;
var mkdirp = require("mkdirp");
var yauzl = require("yauzl");

var database = require("../../../lib/database");
var logger = require("../../../lib/logger");
var outputmanager = require("../../../lib/outputmanager");

// TODO integrate with sockets API to show progress

function Import(req, done) {
  logger.log('info', 'Starting import process');

  var contentMap = {
    'contentobject': 'contentObjects',
    'article': 'articles',
    'block': 'blocks',
    'component': 'components'
  };
  var idMap = {};
  var componentMap = {};
  var extensionMap = {};
  var extensionLocations = {};

  var form = new IncomingForm();
  var courseRoot = path.join('/', app.configuration.getConfig('root'), outputmanager.Constants.Folders.Temp, 'import_test', 'src', 'course', 'en');
  var courseId;
  form.parse(req, function (error, fields, files) {
    if (error) return next(error);
    /**
    * Main process
    * All functions delgated below for readability
    */
    async.series([
      function asyncUnzip(cb) {
        // socket unzipping files
        unzip(files.file.path, function(error) {
          if(error) return cb(error);
          // socket files unzipped
          cb();
        });
      },
      function asyncValidate(cb) {
        // socket validating package
        validateCoursePackage(function(error) {
          if(error) return cb(error);
          // socket package passed validation
          cb();
        });
      },
      function asyncInstallPlugins(cb) {
        // socket installing custom plugins
        installPlugins(function(error) {
          if(error) return cb(error);
          // socket custom plugins installed
          cb();
        });
      },
      function asyncAddAssets(cb) {
        // socket importing assets
        addAssets(function(error) {
          if(error) return cb(error);
          // socket assets imported
          cb();
        });
      },
      function asyncCacheMetadata(cb) {
        cacheMetadata(cb);
      },
      function asyncImportContent(cb) {
        // socket importing course content
        importContent(function(error) {
          if(error) return cb(error);
          // socket course content imported successfully
          cb();
        });
      }
    ], done);
  });

  /**
  * Delegate functions
  */
  function unzip(filePath, done) {
    var root = path.join(app.configuration.getConfig('root'), outputmanager.Constants.Folders.Temp, 'import_test');
    // unzip package
    yauzl.open(filePath, { lazyEntries: true }, function(error, zipfile) {
      if (error) {
        return next(error);
      }
      zipfile.readEntry();
      zipfile.on("entry", function(entry) {
        var dest = path.join(root,entry.fileName);

        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          mkdirp(dest, function(err) {
            if (error) {
              return next(error);
            }
            zipfile.readEntry();
          });
        } else {
          // file entry
          zipfile.openReadStream(entry, function(err, readStream) {
            if (error) {
              return next(error);
            }
            // ensure parent directory exists
            mkdirp(path.dirname(dest), function(err) {
              if (error) {
                return next(error);
              }
              readStream.pipe(fs.createWriteStream(dest));
              readStream.on("end", function() {
                zipfile.readEntry();
              });
            });
          });
        }
      });
      zipfile.once('end', done);
    });
  }

  /**
  * Checks course for any potential incompatibilities
  */
  function validateCoursePackage(done) {
    // TODO check everything's as expected
    logger.log('warn', 'validateCoursePackage needs to be implemented');
    done();
  }

  /**
  * Imports assets to the library
  */
  function addAssets(done) {
    // TODO add assets
    logger.log('warn', 'addAssets needs to be implemented');
    done();
  }

  /**
  * Installs any custom plugins
  */
  function installPlugins(done) {
    // TODO install custom plugins
    logger.log('warn', 'installPlugins needs to be implemented');
    done();
  }

  /**
  * Stores plugin metadata for use later
  */
  function cacheMetadata(done) {
    database.getDatabase(function(error, db) {
      if(error) return cb(error);
      async.parallel([
        function storeComponentypes(cb) {
          db.retrieve('componenttype', {}, { jsonOnly: true }, function(error, results) {
            if(error) return cb(error);
            async.each(results, function(component, cb2) {
              componentMap[component.component] = component._id;
              cb2();
            }, cb);
          });
        },
        function storeExtensiontypes(cb) {
          db.retrieve('extensiontype', {}, { jsonOnly: true }, function(error, results) {
            if(error) return cb(error);
            async.each(results, function(extension, cb2) {
              extensionMap[extension.extension] = extension._id;
              if(extension.properties.pluginLocations) {
                extensionLocations[extension.targetAttribute] = extension.properties.pluginLocations;
              }
              cb2();
            }, cb);
          });
        },
      ], done);
    });
  }

  /**
  * Creates the course content
  */
  function importContent(done) {
    // TODO put this somewhere else
    var courseRoot = path.join('/', app.configuration.getConfig('root'), outputmanager.Constants.Folders.Temp, 'import_test', 'src', 'course');
    async.series([
      function createCourse(cb) {
        fs.readJson(path.join(courseRoot, 'en', 'course.json'), function(error, courseJson) {
          if(error) return cb(error);
          courseJson = _.extend(courseJson, { _isShared: false }); // TODO remove this later
          createContentItem('course', courseJson, '', function(error, courseRec) {
            if(error) return cb(error);
            courseId = idMap[courseJson._id] = courseRec._id;
            cb();
          });
        });
      },
      function createCourse(cb) {
        fs.readJson(path.join(courseRoot, 'config.json'), function(error, configJson) {
          if(error) return cb(error);
          createContentItem('config', configJson, courseId, cb);
        });
      },
      function enableExtensions(cb) {
        // TODO this function should be surfaced properly somewhere
         app.contentmanager.toggleExtensions(courseId.toString(), 'enable', _.values(extensionMap), cb);
      },
      function createContent(cb) {
        var contentRoot = path.join(courseRoot, 'en');
        async.eachSeries(Object.keys(contentMap), function(type, cb2) {
          app.contentmanager.getContentPlugin(type, function(error, plugin) {
            if(error) return cb2(error);
            fs.readJson(path.join(contentRoot, contentMap[type] + '.json'), function(error, contentJson) {
              if(error) return cb2(error);
              // assume we're using arrays
              async.eachSeries(contentJson, function(item, cb3) {
                createContentItem(type, item, courseId, function(error, contentRec) {
                  if(error) return cb3(error);
                  idMap[item._id] = contentRec._id;
                  cb3();
                });
              }, cb2);
            });
          });
        }, cb);
      }
    ], done);
  }

  // TODO update any ids in custom attributes
  // TODO create assets
  function createContentItem(type, originalData, courseId, done) {
    // data needs to be transformed a bit first
    var data = _.extend({}, originalData);
    delete data._id;
    delete data._trackingId;
    delete data._latestTrackingId;
    data.createdBy = app.usermanager.getCurrentUser()._id;
    if(!_.isEmpty(courseId)) data._courseId = courseId;
    if(data._component) {
      data._componentType = componentMap[data._component];
    }
    if(data._parentId) {
      if(idMap[data._parentId]) {
        data._parentId = idMap[data._parentId];
      } else {
        logger.log('warn', 'Cannot update ' + originalData._id + '._parentId, ' +  originalData._parentId + ' not found in idMap');
      }
    }
    // define the custom properties and _extensions
    database.getDatabase(function(error, db) {
      var genericPropKeys = Object.keys(db.getModel(type).schema.paths);
      var customProps = _.pick(data, _.difference(Object.keys(data), genericPropKeys));
      var extensions = _.pick(customProps, _.intersection(Object.keys(customProps),Object.keys(extensionLocations)));
      customProps = _.omit(customProps, Object.keys(extensions));
      data.properties = customProps
      data._extensions = extensions;
      data = _.omit(data, Object.keys(customProps));
      // now we're ready to creat the content
      app.contentmanager.getContentPlugin(type, function(error, plugin) {
        if(error) return done(error);
        plugin.create(data, function(error, record) {
          if(error) {
            logger.log('warn', 'Failed to import ' + type + ' ' + (originalData._id || '') + ' ' + error);
            return done(); // TODO collect failures, maybe try again
          }
          logger.log('debug', 'imported ' + type + ' ' + (originalData._id || '') + ' successfully');
          done(null, record);
        });
      });
    });
  }
}

/**
 * Module exports
 *
 */

exports = module.exports = Import;
