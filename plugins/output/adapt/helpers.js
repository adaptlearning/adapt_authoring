// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var origin = require('../../../')();
var yauzl = require("yauzl");
var fs = require("fs-extra");
var database = require("../../../lib/database");
var logger = require("../../../lib/logger");
var path = require("path");
var Constants = require('../../../lib/outputmanager').Constants;
var semver = require('semver');
var version = require('../../../version');
var crypto = require('crypto');
var filestorage = require('../../../lib/filestorage');

// possible shared functions include:
// addAssets
// removeImport

/**
* unzip import
* @param {string} filePath
* @param {callback} done
*/
function unzip(filePath, unzipPath, done) {
  // unzip package
  yauzl.open(filePath, { lazyEntries: true }, function(error, zipfile) {
    if (error) {
      return next(error);
    }
    zipfile.readEntry();
    zipfile.on("entry", function(entry) {
      var dest = path.join(unzipPath, entry.fileName);
      if (/\/$/.test(entry.fileName)) {
        // directory file names end with '/'
        fs.ensureDir(dest, function(err) {
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
          fs.ensureDir(path.dirname(dest), function(err) {
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
* import a simgle plugin
* @param {string} pluginDir
* @param {string} pluginType
* @param {callback} pluginImported
*/
function importPlugin(pluginDir, pluginType, pluginImported) {
  var bowerJson, contentPlugin;

  async.waterfall([
    function readBowerJson(cb) {
      fs.readJson(path.join(pluginDir, Constants.Filenames.Bower), cb);
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
      if(records.length === 0) {
        var serverVersion = semver.clean(version.adapt_framework);
        var pluginRange = semver.validRange(bowerJson.framework);
        // check the plugin's compatible with the framework
        if(semver.satisfies(serverVersion, pluginRange)) {
          logger.log('info', 'Installing', pluginType, "'" + bowerJson.displayName + "'");
          bowerJson.isLocalPackage = true;
          contentPlugin.addPackage(contentPlugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, cb);
        } else {
          logger.log('info', "Can't install " + bowerJson.displayName + ", it requires framework v" + pluginVersion + " (" + version.adapt_framework + " installed)");
          cb();
        }
      } else {
        var serverPlugin = records[0];
        // TODO what do we do with newer versions of plugins? (could affect other courses if we install new version)
        if(semver.gt(bowerJson.version,serverPlugin.version)) {
          logger.log('info', 'Import contains newer version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') than server (' + serverPlugin.version + '), but not installing');
        }
        cb();
      }
    }
  ], pluginImported);
};


/**
* Adds asset to the DB
* Checks for a similar asset first (filename & size). if similar found, map that
* to the import course.
* TODO adapted from assetmanager.postAsset (...don't duplicate...)
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
      logger.log('debug', fileMetadata.filename + ': similar file found in DB, not importing');
      metadata.idMap[fileMetadata.oldId] = results[0]._id;
      return assetImported();
    }

    var date = new Date();
    var hash = crypto.createHash('sha1');
    var rs = fs.createReadStream(fileMetadata.path);

    rs.on('data', function onReadData(pData) {
      hash.update(pData, 'utf8');
    });
    rs.on('close', function onReadClose() {
      var filehash = hash.digest('hex');
      // TODO get rid of hard-coded assets
      var directory = path.join('assets', filehash.substr(0,2), filehash.substr(2,2));
      var filepath = path.join(directory, filehash) + path.extname(fileMetadata.filename);
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
          // It's better not to set thumbnailPath if it's not set.
          if (storedFile.thumbnailPath) storedFile.thumbnailPath = storedFile.thumbnailPath;
          var asset = _.extend(fileMetadata, storedFile);

          _.each(asset.tags, function iterator(tag, index) {
            if (metadata.idMap[tag]) {
              asset.tags[index] = metadata.idMap[tag];
            } else {
              asset.tags.splice(index, 1);
            }
          });
          // Create the asset record
          origin.assetmanager.createAsset(asset, function onAssetCreated(createError, assetRec) {
            if (createError) {
              storage.deleteFile(storedFile.path, assetImported);
              return;
            }
            // store that asset was imported (used in cleanup if error)
            metadata.assets[assetRec.filename].wasImported = true;
            // add entry to the map
            metadata.idMap[fileMetadata.oldId] = assetRec._id;
            assetImported();
          });
        });
      });
    });
  });
};


exports = module.exports = {
  unzip: unzip,
  importPlugin: importPlugin,
  importAsset: importAsset
};
