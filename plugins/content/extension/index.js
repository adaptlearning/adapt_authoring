/**
 * Extension content plugin
 *
 */

var origin = require('../../../'),
    contentmanager = require('../../../lib/contentmanager'),
    rest = require('../../../lib/rest'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    rimraf = require('rimraf'),
    async = require('async'),
    fs = require('fs'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    util = require('util'),
    path = require('path');

function Extension () {
}

util.inherits(Extension, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Extension.prototype.getModelName = function () {
  return 'extension';
};


/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Extension.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  if (!options.populate) {
    options.populate = { '_extensionType': ['displayName'] };
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 */
Extension.prototype.onDatabaseCreated = function (db) {
  var schemaPath = path.join(__dirname, 'extensiontype.schema');
  try {
    var schema = fs.readFileSync(schemaPath);
    schema = JSON.parse(schema);
    db.addModel('extensiontype', schema);
  } catch (error) {
    logger.log('error', 'failed to parse schema file at ' + schemaPath, error);
  }

};

/**
 * compares semantic version numbers a vs b:
 *
 * @param {semver} a
 * @param {semver} b
 * @return 1 if a > b, -1 if a < b, 0 if equal
 */
function versionCompare (a, b) {
  a = a && a.split('.');
  b = b && b.split('.');

  for (var i = 0; i < a.length, i < b.length; ++i) {
    var aVal = parseInt(a[i], 10);
    var bVal = parseInt(b[i], 10);
    if (aVal > bVal) {
      return 1;
    } else if (bVal > aVal) {
      return -1;
    }
  }

  return 0;
}

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  var app = origin();
  app.once('serverStarted', function (server) {
    // add extensiontype list route
    rest.get('/extensiontype', function (req, res, next) {
      fetchInstalledExtensions(function (err, results) {
        if (err) {
          return next(err);
        }

        // only send the latest version of the extensions
        var extensions = {};
        async.eachSeries(results, function (item, cb) {
          if ('object' !== typeof extensions[item.name]) {
            extensions[item.name] = item;
          } else if (versionCompare(extensions[item.name].version, item.version) < 0) {
            extensions[item.name] = item;
          }

          cb(null);
        },
        function (err) {
          if (err) {
            return next(err);
          }

          return res.json(_.values(extensions));
        });
      });
    });

    // get a single extensiontype definition by id
    rest.get('/extension/:id', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve('extensiontype', { _id: req.params.id }, function (err, results) {
          if (err) {
            return next(err);
          }

          // want to return one only
          if (results && 1 === results.length) {
            return res.json(results[0]);
          }

          res.statusCode = 404;
          return res.json({ success: false, message: 'could not find extension type' });
        });
      });
    });

 // remove extensions from content collections
 // expects an array of extension id's
    rest.post('/extension/disable/:courseid', function (req, res, next) {
      var extensions = req.body;

      logger.log('info', extensions);

      // check if there is an object
      if (!extensions || 'object' !== typeof extensions) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'could not find extensions selected' });
      }

      removeContentExtensions(extensions, function(error, result) {

        if (error) {
          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
          res.json({ success: false, message: error.message });
          return res.end();
        }

        res.statusCode = 200;
        res.json(result);
        return res.end();

      });

    });
  });
}

/**
 * async loop through extesnion ID's, remove extension JSON from content 
 * 
 * @params extensions {object} [extension ID's]
 * @param {callback} cb
*/

function removeContentExtensions (extensions, cb) {

    if (!extensions || 'object' !== typeof extensions) {
      return cb(error);
    }
    logger.log('info', 'remove extensions attempted');

    async.each(extensions, function (item, cb) {
        var extensionLocations = fetchExtensionLocations(item);


    });
}

/**
 * find the collections that this extension is used in. Returns array of collection names
 * 
 * @param {ObjectID|string}  extension - the _id of the extension to update
*/

function fetchExtensionLocations (extension) {
  if (!extension || 0 === extension.length) {
    return null
  }
  database.getDatabase(function (err, db) {
    if (err) {
      return err;
    }

    var extensionLocations;


    return extensionLocations;
  });
}


/**
 * this will retrieve a list of extensions that have been installed on the system
 * if there are no extensions, it will make a single attempt to install extensions
 * and then send the list via the callback
 *
 * @param {object} [options]
 * @param {callback} cb
 */
function fetchInstalledExtensions (options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }

  options = _.extend({
      retry: true
    }, options);

  database.getDatabase(function (err, db) {
    if (err) {
      return cb(err);
    }

    db.retrieve('extensiontype', {}, function (err, results) {
      if (err) {
        return cb(err);
      }

      // there should be at least one installed extension
      if ((!results || 0 === results.length) && options.retry) {
        // update extensions, retry, return
        return updateExtensionTypes(function (err) {
          if (err) {
            return cb(err);
          }

          // try again, but only once
          fetchInstalledExtensions({ retry: false }, cb);
        });
      }

      return cb(null, results);
    });
  });
}

/**
 * adds a new extensiontype to the system - fired after bower
 * has installed the extension code to the extension cache
 *
 * @param {object} extensionInfo - the bower package info retrieved during install
 * @param {callback} cb
 */
function addExtensionType(extensionInfo, cb) {
  var pkgMeta = extensionInfo.pkgMeta;
  if (pkgMeta.keywords) { // only allow extensions (no components, themes, etc;)
    var keywords = _.isArray(pkgMeta.keywords) ? pkgMeta.keywords : [pkgMeta.keywords];
    if (!_.contains(keywords, "adapt-extension")) {
      logger.log('info', 'ignoring non-extension: ' + pkgMeta.name);
      return cb(null);
    }
  } else {
    logger.log('warn', 'ignoring extension without keywords defined: ' + pkgMeta.name);
    return cb(null);
  }

  if (!pkgMeta.version) { // don't allow extensions that don't define versions
    /*
    * @TODO: Re-implement this once component properties.schema files make it to master!
    logger.log('warn', 'ignoring unversioned extension: ' + pkgMeta.name);
    return cb(null);
    */
    pkgMeta.version = "0.2.0"; // Remove me later - see above ^
  } 

  var schemaPath = path.join(extensionInfo.canonicalDir, defaultOptions._adaptSchemaFile);
  fs.exists(schemaPath, function (exists) {
    if (!exists) {
      logger.log('warn', 'ignoring extension with no schema: ' + pkgMeta.name);
      return cb(null);
    }

    fs.readFile(schemaPath, function (err, data) {
      var schema = false;
      if (err) {
        // don't error out, just notify
        logger.log('error', 'failed to parse extension schema for ' + pkgMeta.name, err);
        return cb(null);
      }
      try {
        schema = JSON.parse(data);
      } catch (e) {
        // don't error out, just notify
        logger.log('error', 'failed to parse extension schema for ' + pkgMeta.name, e);
        return cb(null);
      }

      // Copy this version of the extension to a holding area (used for publishing).
      // Folder structure: <versions folder>/adapt-contrib-graphic/0.0.2/adapt-contrib-graphic/...
      var destination = defaultOptions.extensionVersionsFolder + '/' + pkgMeta.name + '/' + pkgMeta.version + '/' + pkgMeta.name;
      fs.exists(destination, function(exists) {
        if (!exists) {
          mkdirp(destination, function (err) {
            if (err) {
              cb(err);
            } else {
              ncp(extensionInfo.canonicalDir, destination, function (err) {
                if (err) {
                  cb(err);
                }
              });
            }
          });
        }
      });

      logger.log('info', 'Try ' + pkgMeta.name);

      // add the extension to the extensiontypes collection
      database.getDatabase(function (err, db) {
        if (err) {
          return cb(err);
        }

        // add extension type
        var extensionType = {
          name: pkgMeta.name,
          displayName: pkgMeta.displayName,
          extension: pkgMeta.extension,
          description: pkgMeta.description,
          version: pkgMeta.version,
          properties: schema.properties
        };

        // don't duplicate extension.name, extension.version
        db.retrieve('extensiontype', { name:extensionType.name, version:extensionType.version }, function (err, results) {
          if (err) {
            return cb(err);
          }

          if (results && 0 !== results.length) {
            // don't add duplicate
            logger.log('silly', 'ignoring duplicate extension version', extensionType);
            return cb(null);
          }

          db.create('extensiontype', extensionType, function (err, results) {
            if (err) {
              // don't error out if we didn't add the extension, just notify
              logger.log('error', 'Failed to add extension: ' + pkgMeta.name, err);
              return cb(null);
            }
            logger.log('info', 'Added extension: ' + pkgMeta.name);
            return cb(null, results);
          });
        });
      });
    });
  });
}

/**
 * this function uses bower to search and install new adapt framework
 * extensions to the authoring tool
 *
 * @param {object} options - bower configuration and local config options
 * @param {callback} cb
 */
function updateExtensionTypes (options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }

  // log the update with any passed options
  logger.log('info', 'updating extension types', options);

  options = _.extend(defaultOptions, options);
  // update directory relative to server location
  options.cwd = configuration.serverRoot;

  // clean our bower cache
  rimraf(options.directory, function (err) {
    if (err) {
      return cb(err);
    }
    bower.commands
      .search('', options) // search all extensions or only contrib?
      .on('end', function (results) {
        // lets bower install each
        async.map(results,
          function (item, next) {
            next(null, item.name);
          },
          function (err, nameList) {
            /*
            * @TODO: Remove array below once extension properties.schema files make it to master!
            */
            var nameList = [
            "adapt-contrib-assessment#develop",
            "adapt-contrib-pageLevelProgress#develop",
            "adapt-contrib-resources#develop",
            "adapt-contrib-spoor#develop",
            "adapt-contrib-trickle#develop",
            "adapt-contrib-tutor#develop"
          ];

            logger.log('info', 'fetched extensions from bower repository');
              bower.commands
              .install(nameList, { save: true }, options)
              .on('error', cb)
              .on('end', function (extensionInfo) {
              // add details for each to the db
              async.eachSeries(Object.keys(extensionInfo), function (key, next) {
              addExtensionType(extensionInfo[key], next);
              },
              cb);
            });
          });
      });
  });
}

// setup extensions
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Extension;
