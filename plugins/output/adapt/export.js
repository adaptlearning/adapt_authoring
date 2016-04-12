var archiver = require('archiver');
var async = require('async');
var Constants = require('../../../lib/outputmanager').Constants;
var configuration = require('../../../lib/configuration');
var database = require('../../../lib/database');
var filestorage = require('../../../lib/filestorage');
var fse = require('fs-extra');
var origin = require('../../../')();
var path = require('path');
var usermanager = require('../../../lib/usermanager');

/**
* Global vars
* For access by the other funcs
*/

// directories
var FRAMEWORK_ROOT_DIR = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
var COURSE_ROOT_DIR;
var EXPORT_DIR;

// the 'this' context for AdaptOutput
var ctx;

var courseId;

// the top-level callback
var next;

// used with _.omit when saving metadata
var blacklistedProps = [
  '__v',
  '_isDeleted',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  '_hasPreview'
];

/**
* Course import function
* TODO need implementation notes
*      - metadata structure
*      - devMode param
*/

exports = module.exports = function Export(pCourseId, devMode, request, response, pNext) {
  // store the params
  var currentUser = usermanager.getCurrentUser();
  COURSE_ROOT_DIR = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.AllCourses, currentUser.tenant._id, pCourseId);
  EXPORT_DIR = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.Exports, currentUser._id);
  ctx = this;
  courseId = pCourseId;
  next = pNext;

  // create the EXPORT_DIR if it isn't there
  fse.ensureDir(EXPORT_DIR, function(error) {
    if(error) {
      return next(error);
    }
    // export tasks vary based on type of export
    async.auto(devMode === 'true' ? {
      // dev export
      generateLatestBuild: generateLatestBuild,
      copyFrameworkFiles: ['generateLatestBuild', copyFrameworkFiles],
      copyCourseFiles: ['generateLatestBuild', copyCourseFiles]
    } : {
      // standard export
      generateMetadata: generateMetadata,
      copyCustomPlugins: ['generateMetadata', copyCustomPlugins],
      copyAssets: ['generateMetadata', copyAssets]
    }, zipExport);
  });
};

function generateLatestBuild(courseBuilt) {
  ctx.publish(courseId, true, null, null, courseBuilt);
};

/**
* Metadata functions
*/

// creates metadata.json file
function generateMetadata(generatedMetadata) {
  async.parallel([
    function(callback) {
      getPackageData(FRAMEWORK_ROOT_DIR, callback);
    },
    function(callback) {
      getCourseMetdata(courseId, callback);
    },
    function(callback) {
      getAssetMetadata(courseId, callback);
    },
    function(callback) {
      getPluginMetadata(courseId, callback);
    },
  ], function(error, results) {
    if(error) {
      return generatedMetadata(error);
    }
    metadata = _.reduce(results, function(memo,result){ return _.extend(memo,result); });
    fse.writeJson(path.join(EXPORT_DIR, ctx.Constants.Filenames.Metadata), metadata, { spaces:0 }, generatedMetadata);
  });
};


// pulls out relevant attributes from package.json
function getPackageData(frameworkDir, gotPackageJson) {
  fse.readJson(path.join(frameworkDir, ctx.Constants.Filenames.Package), function onJsonRead(error, packageJson) {
    gotPackageJson(null, _.pick(packageJson,
      'version'
    ));
  });
};

// rips all course data from the DB
function getCourseMetdata(courseId, gotCourseMetadata) {
  database.getDatabase(function(error, db) {
    if (error) {
      return callback(error);
    }
    // metadata structure
    var metadata = {
      course: {}
    };

    async.each(Object.keys(Constants.CourseCollections), function iterator(collectionType, doneIterator) {
      var criteria = collectionType === 'course' ? { _id: courseId } : { _courseId: courseId };
      db.retrieve(collectionType, criteria, {operators: { sort: { _sortOrder: 1}}}, function dbRetrieved(error, results) {
        if (error) {
          gotCourseMetadata(doneIterator);
        }
        // only store the _doc values
        var toSave = _.pluck(results,'_doc');
        // store data, remove blacklisted properties
        // TODO make sure we're only saving what we need
        _.each(toSave, function(item, index) { toSave[index] = _.omit(item, blacklistedProps); });
        metadata.course[collectionType] = toSave;

        doneIterator();
      });
    }, function doneEach(error) {
      gotCourseMetadata(error, metadata);
    });
  }, usermanager.getCurrentUser().tenant._id);
};

function getAssetMetadata(courseId, gotAssetMetadata) {
  // metadata structure
  var metadata = {
    assets: {},
    courseassets: []
  };
  origin.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
    plugin.retrieve({ _courseId:courseId }, function(error, results) {
      if(error) {
        return gotAssetMetadata(error);
      }
      async.each(results, function iterator(courseasset, doneIterator) {
        origin.assetmanager.retrieveAsset({ _id:courseasset._assetId }, function(error, matchedAssets) {
          if(error) {
            return doneIterator(error);
          }
          if(!matchedAssets) {
            return doneIterator(new Error('No asset found with id: ' + courseasset._assetId));
          }
          if(matchedAssets.length > 1) {
            logger.log('info',"export.getAssetMetadata: multiple assets found with id", courseasset._assetId, "using first result");
          }
          var asset = matchedAssets[0];

          // would _.pick, but need to map some keys
          // TODO not ideal
          if(!metadata.assets[asset.filename]) {
            metadata.assets[asset.filename] = {
              "oldId": asset._id,
              "title": asset.title,
              "description": asset.description,
              "type": asset.mimeType,
              "size": asset.size
            };
          }
          // else console.log('Asset already stored:', asset.filename);

          // store the courseasset, omitting the blacklistedProps + _id
          var toOmit = blacklistedProps.concat([ "_id" ]);
          var courseassetData = _.omit(courseasset._doc, toOmit);
          metadata.courseassets.push(courseassetData);

          doneIterator();
        });
      }, function doneEach(error) {
        gotAssetMetadata(error, metadata);
      });
    });
  });
};

/**
* Generates:
* - A map for component types
* - List of plugins to include (i.e. plugins that have been manually updated,
*   or are completely custom)
*/
function getPluginMetadata(courseId, gotPluginMetadata) {
  /*
  * HACK there's got to be a way to get this info dynamically
  * We need:
  * - Content plugin name to see if it's already installed (so need plugin type)
  * - Plugin folder name to find plugin code (so need the plugin folder name -- maybe do this with a glob/search?)
  * (See Import.importPlugins for context)
  * For now, add map to metadata
  */
  var metadata = {
    pluginTypes: [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions' },
      { type: 'menu',      folder: 'menu'       },
      { type: 'theme',     folder: 'theme'      }
    ],
    pluginIncludes: []
  };

  var includes;
  async.waterfall([
    function getPlugin(cb) {
      origin.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), cb);
    },
    function getIncludes(plugin, cb) {
      plugin.generateIncludesForCourse(courseId, cb);
    },
    function getDb(pIncludes, cb) {
      includes = pIncludes;
      database.getDatabase(cb);
    },
    function generateIncludes(db, cb) {
      async.each(metadata.pluginTypes, function iterator(pluginType, doneIterator) {
        db.retrieve(pluginType.type + 'type', { "isLocalPackage": true, "_isDeleted": false }, function gotTypeDoc(error, results) {
          if(error) {
            return cb(error);
          }
          async.each(results, function iterator(result, doneIterator2) {
            if(_.indexOf(includes, result.name) !== -1) {
              var data = _.extend(pluginType, { name: result.name });
              metadata.pluginIncludes.push(data);
            }
            doneIterator2();
          }, doneIterator);
        });
      }, cb);
    }
  ], function doneWaterfall(error) {
    gotPluginMetadata(error, metadata);
  });
};

/**
* Copy functions
*/

// copies relevant files in adapt_framework
function copyFrameworkFiles(filesCopied) {
  ctx.generateIncludesForCourse(courseId, function(error, includes) {
    if(error) {
      return includesGenerated(error);
    }
    // create list of includes
    for(var i = 0, count = includes.length; i < count; i++)
    includes[i] = '\/' + includes[i] + '(\/|$)';

    var includesRE = new RegExp(includes.join('|'));
    var excludesRE = new RegExp(/\.git\b|\.DS_Store|\/node_modules|\/courses\b|\/course\b|\/exports\b/);
    var pluginsRE = new RegExp('\/components\/|\/extensions\/|\/menu\/|\/theme\/');

    fse.copy(FRAMEWORK_ROOT_DIR, EXPORT_DIR, {
      filter: function(filePath) {
        var posixFilePath = filePath.replace(/\\/g, '/');
        var isIncluded = posixFilePath.search(includesRE) > -1;
        var isExcluded = posixFilePath.search(excludesRE) > -1;
        var isPlugin = posixFilePath.search(pluginsRE) > -1;

        // exclude any matches to excludesRE
        if(isExcluded) return false;
        // exclude any plugins not in includes
        else if(isPlugin) return isIncluded;
        // include everything else
        else return true;
      }
    }, function doneCopy(error) {
      if (error) {
        return filesCopied(error);
      }
      copyCourseFiles(filesCopied);
    });
  });
};

// uses the metadata list to include only relevant plugin files
function copyCustomPlugins(filesCopied) {
  var src = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.Source);
  var dest = path.join(EXPORT_DIR, ctx.Constants.Folders.Plugins);
  async.each(metadata.pluginIncludes, function iterator(plugin, cb) {
    var pluginDir = path.join(src, plugin.folder, plugin.name);
    fse.copy(pluginDir, path.join(dest, plugin.name), cb);
  }, filesCopied);
};

// copies everything in the course folder
function copyCourseFiles(filesCopied) {
  var source = path.join(COURSE_ROOT_DIR, Constants.Folders.Build, Constants.Folders.Course);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Source, Constants.Folders.Course);
  fse.ensureDir(dest, function(error) {
    if (error) {
      return filesCopied(error);
    }
    fse.copy(source, dest, filesCopied);
  });
};

// copies used assets directly from the data folder
function copyAssets(assetsCopied) {
  var dest = path.join(EXPORT_DIR, ctx.Constants.Folders.Assets);
  fse.ensureDir(dest, function(error) {
    if (error) {
      return filesCopied(error);
    }
    async.each(Object.keys(metadata.assets), function iterator(assetKey, doneIterator) {
      var oldId = metadata.assets[assetKey].oldId;
      origin.assetmanager.retrieveAsset({ _id:oldId }, function(error, results) {
        if(error) {
          return doneIterator(error);
        }
        filestorage.getStorage(results[0].repository, function gotStorage(error, storage) {
          var srcPath = storage.resolvePath(results[0].path);
          var destPath = path.join(dest, assetKey);
          fse.copy(srcPath, destPath, doneIterator);
        });
      });
    }, assetsCopied);
  });
};

/**
* post-processing
*/

function zipExport(error) {
  if(error) {
    return next(error);
  }
  var archive = archiver('zip');
  var output = fse.createWriteStream(EXPORT_DIR +  '.zip');
  archive.on('error', cleanUpExport);
  output.on('close', cleanUpExport);
  archive.pipe(output);
  archive.bulk([{ expand: true, cwd: EXPORT_DIR, src: ['**/*'] }]).finalize();
};

// remove the EXPORT_DIR, if there is one
function cleanUpExport(exportError) {
  fse.remove(EXPORT_DIR, function(removeError) {
    next(exportError || removeError);
  });
};
