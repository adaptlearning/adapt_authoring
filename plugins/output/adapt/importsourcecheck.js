// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
const _ = require('underscore');
const async = require('async');
const bytes = require('bytes');
const configuration = require('../../../lib/configuration');
const Constants = require('../../../lib/outputmanager').Constants;
const database = require("../../../lib/database");
const fs = require("fs-extra");
const helpers = require('./outputHelpers');
const IncomingForm = require('formidable').IncomingForm;
const logger = require("../../../lib/logger");
const path = require("path");
const semver = require('semver');

function ImportSourceCheck(req, done) {
  var contentMap = {
    course: 'course',
    config: 'config',
    contentobject: 'contentObjects',
    article: 'articles',
    block: 'blocks',
    component: 'components'
  };
  var plugindata = {
    pluginTypes: [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions', attribute: '_extensions' },
      { type: 'menu',      folder: 'menu',       attribute: 'menuSettings' },
      { type: 'theme',     folder: 'theme',      attribute: 'themeSettings' }
    ],
    pluginIncludes: [],
    theme: [],
    menu: []
  };
  var userId = app.usermanager.getCurrentUser()._id;
  var tenantId = app.usermanager.getCurrentUser().tenant._id;
  var unzipFolder = tenantId + '_' + userId + '_unzipped';
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, unzipFolder);
  var COURSE_LANG;
  var COURSE_JSON_PATH = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Course);
  var IMPORT_INFO_FILE = 'importInfo.json';
  var importInfo = {};
  var cleanFormAssetDirs;
  var details = {
    frameworkVersions: {},
    pluginVersions : {
      white: {},
      'green-install': {},
      'green-update': {},
      amber: {},
      red: {}
    }
  };

  /**
   * Main process
   * All functions delegated below for readability
   */
  async.series([
    prepareImport,
    findLanguages,
    validateCoursePackage,
    createImportMetaData
  ], (importErr) => {
    if (!_.isEmpty(details.pluginVersions.red) || importErr) {
      // There are red plugins so no import possible, clean up now
      helpers.cleanUpImport(importInfo['cleanupDirs'], function() {
        done(importErr, details);
      });
      return;
    }
    done(importErr, details);
  });

  function prepareImport(cb) {
    async.parallel([
      function(cb2) {
        database.getDatabase(cb2);
      },
      function(cb2) {
        const form = new IncomingForm();
        form.maxFileSize = configuration.getConfig('maxFileUploadSize');
        // parse the form
        form.parse(req, function (error, fields, files) {
          if(error) {
            if (form.bytesExpected > form.maxFileSize) {
              return cb2(new Error(app.polyglot.t('app.uploadsizeerror', {
                 max: bytes.format(form.maxFileSize),
                 size: bytes.format(form.bytesExpected)
              })));
            }
            return cb2(error);
          }
          var formAssetDirs = (fields.formAssetFolders && fields.formAssetFolders.length) ? fields.formAssetFolders.split(',') : [];
          importInfo['formTags'] = (fields.tags && fields.tags.length) ? fields.tags.split(',') : [];
          cleanFormAssetDirs = formAssetDirs.map(item => item.trim());

          // clear any previous import files
          fs.emptyDir(COURSE_ROOT_FOLDER, function(error) {
            if(error) return cb2(error);
            // upzip the uploaded file
            logger.log('info', 'unzipping');
            logger.log('info', COURSE_ROOT_FOLDER);
            logger.log('info', files.file.path)
            helpers.unzip(files.file.path, COURSE_ROOT_FOLDER, function(error) {
              if(error) return cb2(error);
              importInfo['cleanupDirs'] = [files.file.path, COURSE_ROOT_FOLDER];
              cb2();
            });
          });
        });
      }
    ], cb);
  }

  function findLanguages(cb) {
    var courseLangs = [];
    fs.readdir(COURSE_JSON_PATH, function (error, files) {
      if (error) {
        return cb(new Error(app.polyglot.t('app.importinvalidpackage')));
      }
      files.map(function (file) {
        return path.join(COURSE_JSON_PATH, file);
      }).filter(function (file) {
        return fs.statSync(file).isDirectory();
      }).forEach(function (file) {
        courseLangs.push(path.basename(file));
      });
      COURSE_LANG = courseLangs[0] ? courseLangs[0] : 'en';
      importInfo['COURSE_LANG'] = COURSE_LANG;
      cb();
    });
  }

  /**
   * Checks course for any potential incompatibilities
   */
  function validateCoursePackage(done) {
    // - Check framework version compatibility
    // - Check we have all relevant json files using contentMap
    // - Check assets
    // - Check plugin versions
    async.auto({
      checkFramework: function(cb) {
        fs.readJson(path.join(COURSE_ROOT_FOLDER, 'package.json'), function(error, versionJson) {
          if(error) return cb(error);
          helpers.checkFrameworkVersion(versionJson, function(error, data) {
            if(error) return cb(error);
            details.frameworkVersions = data;
            if (semver.major(data.imported) > semver.major(data.installed)) {
              details.frameworkVersions.downgrade = true;
              return done();
            }
            cb();
          });
        });
      },
      checkContentJson: ['checkFramework', function(results, cb) {
        async.eachSeries(Object.keys(contentMap), function(type, cb2) {
          var jsonPath = path.join(COURSE_JSON_PATH, (type !== 'config') ? COURSE_LANG : '', `${contentMap[type] || type}.json`);
          if (!fs.existsSync(jsonPath)) {
            return cb2(new Error(app.polyglot.t('app.errorloadfiles')));
          }
          cb2();
        }, cb);
      }],
      checkAssetFolders: ['checkContentJson', function(results, cb) {
        if (!cleanFormAssetDirs.length) {
          importInfo['assetFolders'] = Constants.Folders.ImportAssets;
          return cb();
        }
        var assetFolderError = false;
        var missingFolders = [];
        importInfo['assetFolders'] = cleanFormAssetDirs;
        for (var i = 0, j = importInfo['assetFolders'].length; i < j; ++i) {
          var assetFolder = importInfo.assetFolders[i];
          var assetFolderPath = path.join(COURSE_JSON_PATH , COURSE_LANG, assetFolder);
          if (!fs.existsSync(assetFolderPath)) {
            assetFolderError = true;
            missingFolders.push(assetFolder);
          }
        }
        // if a user input folder is missing log error and abort early
        if (assetFolderError) {
          var folderError = 'Cannot find asset folder/s ' + missingFolders.toString() + ' in framework import.';
          return cb(folderError);
        }
        cb();
      }],
      checkPlugins: ['checkAssetFolders', function(results, cb) {
        async.each(plugindata.pluginTypes, function iterator(pluginType, doneMapIterator) {
          var srcDir = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, pluginType.folder);

          if (!fs.existsSync(srcDir)) {
            logger.log('info', 'No plugins found.');
            return doneMapIterator();
          }
          fs.readdir(srcDir, function (err, files) {
            if (err) {
              return doneMapIterator(err);
            }
            files.map(function (file) {
              return path.join(srcDir, file);
            }).filter(function (file) {
              return fs.statSync(file).isDirectory();
            }).forEach(function (file) {
              var data = _.extend(_.clone(pluginType), { location: file });
              plugindata.pluginIncludes.push(data);
            });
            doneMapIterator();
          });
        }, function(err) {
          if(err) {
            return done(err);
          }

          importInfo['pluginIncludes'] = plugindata.pluginIncludes;

          async.each(plugindata.pluginIncludes, function (pluginData, cb2) {
            fs.readJSON(path.join(pluginData.location, Constants.Filenames.Bower), function(error, data) {
              if (error) return cb2(error);
              helpers.getPluginFrameworkVersionCategory(details.frameworkVersions.installed, data, pluginData.type, function (error, result) {
                details.pluginVersions[result.category][data.name] = { importVersion: data.version, displayName: data.displayName, authoringToolVersion: result.authoringToolVersion };
                pluginData.name = data.name;
                cb2();
              });
            });
          }, function () {
            importInfo['details'] = details;
            cb();
          });
        });
      }]
    }, done);
  }

  function createImportMetaData(cb) {
    fs.outputFile(path.join(COURSE_ROOT_FOLDER, IMPORT_INFO_FILE), JSON.stringify(importInfo), function (error) {
      if (error) return cb(error);
      cb();
    });
  }
}

/**
 * Module exports
 *
 */

exports = module.exports = ImportSourceCheck;
