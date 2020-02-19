// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var fs = require("fs-extra");
var path = require("path");
var semver = require('semver');
var util = require('util');
var yauzl = require("yauzl");

var Constants = require('../../../lib/outputmanager').Constants;
var database = require("../../../lib/database");
var filestorage = require('../../../lib/filestorage');
var logger = require("../../../lib/logger");
var installHelpers = require('../../../lib/installHelpers');

var origin = require('../../../')();

/**
* unzip import
* @param {string} filePath
* @param {string} unzipPath
* @param {callback} done
*/
function unzip(filePath, unzipPath, done) {
  yauzl.open(filePath, { lazyEntries: true }, function(error, zipfile) {
    if (error) {
      return done(error);
    }
    zipfile.readEntry();
    zipfile.on("entry", function(entry) {
      var dest = path.join(unzipPath, entry.fileName);
      if (/\/$/.test(entry.fileName)) {
        fs.ensureDir(dest, function(err) {
          if (error) {
            return done(error);
          }
          zipfile.readEntry();
        });
      } else {
        zipfile.openReadStream(entry, function(err, readStream) {
          if (error) {
            return done(error);
          }
          fs.ensureDir(path.dirname(dest), function(err) {
            if (error) {
              return done(error);
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
* import a single plugin
* @param {string} pluginDir
* @param {string} pluginType
* @param {callback} pluginImported
*/
function importPlugin(pluginDir, pluginType, pluginImported) {
  var bowerJson, contentPlugin;

  async.waterfall([
    function readBowerJson(cb) {
      fs.stat(path.join(pluginDir, Constants.Filenames.Bower), function(error, stats) {
        if (error) {
            logger.log('error', error)
            return pluginImported();
        }
        fs.readJson(path.join(pluginDir, Constants.Filenames.Bower), cb);
      });
    },
    function getContentPlugin(json, cb) {
      bowerJson = json;
      origin.contentmanager.getContentPlugin(pluginType, cb);
    },
    function getDB(plugin, cb) {
      contentPlugin = plugin;
      database.getDatabase(cb);
    },
    function retrievePluginDoc(db, cb) {
      db.retrieve(contentPlugin.bowerConfig.type, { name: bowerJson.name }, { jsonOnly: true }, cb);
    },
    function addPlugin(records, cb) {
      if (records.length === 0) {
        logger.log('info', 'Installing', pluginType, "'" + bowerJson.displayName + "'");
        bowerJson.isLocalPackage = true;
        app.bowermanager.addPackage(contentPlugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, cb);
      } else {
        var serverPlugin = records[0];
        var serverPluginVersion = semver.clean(serverPlugin.version);
        var bowerVersion = semver.clean(bowerJson.version);
        bowerJson.isLocalPackage = true;

        if(serverPluginVersion && bowerVersion && semver.gt(bowerVersion, serverPluginVersion)) {
          logger.log('info', 'Import contains newer version of ' + bowerJson.displayName + ' (' + bowerVersion + ') than server (' + serverPluginVersion + '), upgrading');
          app.bowermanager.addPackage(contentPlugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, cb);
        } else {
          cb();
        }
      }
    }
  ], pluginImported);
};


/**
* Adds asset to the DB
* Checks for a similar asset first (filename & size). if similar found, map that
* to the import course.
* @param {object} fileMetadata
* @param {object} metadata
* @param {callback} assetImported
*/
function importAsset(fileMetadata, metadata, assetImported) {
  var search = {
    filename: fileMetadata.filename,
    size: fileMetadata.size
  };
  origin.assetmanager.retrieveAsset(search, function gotAsset(error, results) {
    if(results.length > 0) {
      metadata.idMap[fileMetadata.oldId] = results[0]._id;
      if (metadata.assetNameMap) {
        metadata.assetNameMap[results[0]._id] = results[0].filename;
      }
      return assetImported();
    }

    var hash = crypto.createHash('sha1');
    var rs = fs.createReadStream(fileMetadata.path);

    rs.on('error', error => logger.log('error', error));
    rs.on('data', function onReadData(pData) {
      hash.update(pData, 'utf8');
    });
    rs.on('close', function onReadClose() {
      var filehash = hash.digest('hex');
      var directory = path.join('assets', filehash.substr(0,2), filehash.substr(2,2));
      var filepath = path.join(directory, filehash) + path.extname(fileMetadata.filename);
      var filename = path.basename(filepath);
      // change filename to hashed name
      fileMetadata.filename = filename;
      fileMetadata.directory = directory;
      var fileOptions = {
        createMetadata: true,
        createThumbnail: true,
        thumbnailOptions: {
          width: '?',
          height: '200'
        }
      };
      filestorage.getStorage(fileMetadata.repository, function gotStorage(error, storage) {
        if (error) {
          return assetImported(error);
        }
        // the repository should move the file to a suitable location
        storage.processFileUpload(fileMetadata, filepath, fileOptions, function onFileUploadProcessed(error, storedFile) {
          if (error) {
            return assetImported(error);
          }

          var asset = _.extend(fileMetadata, storedFile);

          origin.assetmanager.createAsset(asset, function onAssetCreated(createError, assetRec) {
            if (createError) {
              storage.deleteFile(storedFile.path, assetImported);
              return;
            }
            // store that asset was imported (used in cleanup if error)
            if (metadata.assets) {
              metadata.assets[assetRec.filename].wasImported = true;
            }
            // add entry to the map
            metadata.idMap[fileMetadata.oldId] = assetRec._id;
            if (metadata.assetNameMap) {
              metadata.assetNameMap[assetRec._id] = assetRec.filename;
            }
            assetImported();
          });
        });
      });
    });
  });
};



/**
* Retrieves the framework version numbers in the system and in the import. Checks import version is valid.
* @param {object} versionMetaData
* @param {callback} cb
*/
function checkFrameworkVersion(versionMetaData, cb) {
  installHelpers.getInstalledFrameworkVersion(function(err, frameworkVersion ) {
    if (err) {
      return cb(err)
    }

    var installedVersion = semver.clean(frameworkVersion);
    var importedVersion = semver.clean(versionMetaData.version);

    if (!importedVersion) {
      return cb(new ImportError('Invalid version number (' + importedVersion + ') found in import package.json'), 400)
    }
    cb(null, { installed: installedVersion, imported: importedVersion});
  });
};

/**
 * Gets category to describe plugin framework version against installed framework version
 * @param serverFrameworkVersion
 * @param pluginMetaData
 * @returns {*}
 */
function getPluginFrameworkVersionCategory(serverFrameworkVersion, pluginMetaData, type, callback) {
  var pluginFrameworkVersion = pluginMetaData.framework;
  var contentPlugin;

  async.waterfall([
    function getContentPlugin(cb) {
      origin.contentmanager.getContentPlugin(type, cb);
    },
    function getDB(plugin, cb) {
      contentPlugin = plugin;
      database.getDatabase(cb);
    },
    function retrievePluginDoc(db, cb) {
      db.retrieve(contentPlugin.bowerConfig.type, { name: pluginMetaData.name }, { jsonOnly: true }, cb);
    },
    function categorisePlugin(records, cb) {
      var importPluginVersionValid = semver.valid(pluginMetaData.version);
      if (records.length === 0) {
        // Not already installed so could be:
        // Red - this plugin is not compatible or the version is invalid
        // Green - this plugin is compatible and will be installed
        if (!importPluginVersionValid) {
          return cb(null, {category: 'red', authoringToolVersion: app.polyglot.t('app.none')});
        }
        if (semver.satisfies(serverFrameworkVersion, pluginFrameworkVersion, {
            includePrerelease: true
          })) {
          return cb(null, {category: 'green-install', authoringToolVersion: app.polyglot.t('app.none')});
        }
        return cb(null, {category: 'red', authoringToolVersion: app.polyglot.t('app.none')});
      }

      // A version is already installed so could be:
      // White - same version installed as in course
      // Red - invalid version
      // Amber - newer version installed and will be used in the course instead
      // Green - older version installed so this newer version will be upgraded in the AT
      var serverPlugin = records[0];
      if (!importPluginVersionValid || !semver.valid(serverPlugin.version)) {
        return cb(null, {category: 'red', authoringToolVersion: serverPlugin.version});
      }
      var serverPluginVersion = semver.clean(serverPlugin.version);
      var isServerVersionLatest = semver.compare(serverPluginVersion, pluginMetaData.version);
      if (isServerVersionLatest === 0) {
        return cb(null, {category: 'white', authoringToolVersion: app.polyglot.t('app.none')});
      }
      if (semver.satisfies(serverFrameworkVersion, pluginFrameworkVersion, {
          includePrerelease: true
        }) && isServerVersionLatest < 0) {
        return cb(null, {category: 'green-update', authoringToolVersion: serverPluginVersion});
      }
      cb(null, {category: 'amber', authoringToolVersion: serverPluginVersion});
    }
  ], function(error, category) {
    return callback(error, category);
  });
};

function validateCourse(data, cb) {
  let errors = '';
  let contentObjects = data.contentobject;

  if (typeof contentObjects === 'undefined') {
    let courseString = app.polyglot.t('app.course');
    errors += app.polyglot.t('app.doesnotcontain', {
      type: courseString[0].toUpperCase() + courseString.slice(1),
      title: data.course[0].title,
      childType: app.polyglot.t('app.page', 0)
    }) + '\n';
    return cb(errors, false);
  }

  const contentHierarchy = [
    contentObjects.filter(({ _type }) => _type === 'menu'),
    contentObjects.filter(({ _type }) => _type === 'page'),
    data.article,
    data.block,
    data.component
  ];

  for (let i = 0, j = contentHierarchy.length - 1; i < j; i++) {
    errors += iterateThroughChildren(contentHierarchy[i], contentHierarchy[i + 1]);
  }

  if (errors.length !== 0) return cb(errors, false);

  return cb(null, true);
}

function iterateThroughChildren(parents, children) {
  let errors = '';
  if (typeof parents === 'undefined') return errors;

  const appendError = (parentType, parentTitle, childType) => {
    errors += app.polyglot.t('app.doesnotcontain', {
      type: parentType[0].toUpperCase() + parentType.slice(1),
      title: parentTitle,
      childType: childType
    }) + '\n';
  };

  parents.forEach(parent => {
    let parentType = app.polyglot.t('app.' + parent._type, 1);
    let childType = app.polyglot.t('app.children');

    if (typeof children === 'undefined') {
      appendError(parentType, parent.title, childType);
      return;
    }

    if (children[0] && children[0]._type) childType = app.polyglot.t('app.' + children[0]._type, 0);
    let found = children.find(child => JSON.stringify(child._parentId) === JSON.stringify(parent._id));

    if (typeof found === 'undefined') {
      appendError(parentType, parent.title, childType);
    }
  });
  return errors;
}

function ImportError(message, httpStatus) {
  this.message = message || "Course import failed";
  this.httpStatus = httpStatus || 500;
};

function PartialImportError(message, httpStatus) {
  this.message = message || "Partial course import";
  this.httpStatus = httpStatus || 500;
}

util.inherits(ImportError, Error);
util.inherits(PartialImportError, ImportError);


/**
* Recursively sorts list to ensure parents come before children
*/
function sortContentObjects(list, parentId, sorted) {
  // remove parent
  var parentIndex = _.findIndex(list, { _id: parentId });
  if(parentIndex > -1) list.splice(_.findIndex(list, { _id: parentId }), 1);
  // recursively store children
  var thisChildren = _.where(list, { _parentId: parentId });
  _.each(thisChildren, function(child, index) {
    sorted.push(child);
    sortContentObjects(list, child._id, sorted);
  });
  return sorted;
};


// deletes passed list of dirs/files
function cleanUpImport(dirs, doneCleanUp) {
  async.each(dirs, fs.remove, doneCleanUp);
};

exports = module.exports = {
  unzip: unzip,
  importPlugin: importPlugin,
  importAsset: importAsset,
  checkFrameworkVersion: checkFrameworkVersion,
  getPluginFrameworkVersionCategory: getPluginFrameworkVersionCategory,
  ImportError: ImportError,
  PartialImportError: PartialImportError,
  sortContentObjects: sortContentObjects,
  cleanUpImport: cleanUpImport,
  validateCourse: validateCourse
};
