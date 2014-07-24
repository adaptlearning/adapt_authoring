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
      fetchInstalledExtensions(req.query, function (err, results) {
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
    rest.get('/extensiontype/:id', function (req, res, next) {
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
 // expects course ID and an array of extension id's
    rest.post('/extension/disable/:courseid', function (req, res, next) {
      var extensions = req.body.extensions;
      var courseId = req.params.courseid;

      // check if there is an object
      if (!extensions || 'object' !== typeof extensions) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'extensions should be an array of ids' });
      }

      toggleExtensions(courseId, 'disable', extensions, function(error, result) {

        if (error) {
          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
          res.json({ success: false, message: error.message });
          return res.end();
        }

        res.statusCode = 200;
        res.json({success: true});
        return res.end();

      });

    });

 // add extensions to content collections
 // expects course ID and an array of extension id's
    rest.post('/extension/enable/:courseid', function (req, res, next) {
      var extensions = req.body.extensions;
      var courseId = req.params.courseid;

      // check if there is an object
      if (!extensions || 'object' !== typeof extensions) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'extensions should be an array of ids' });
      }

      toggleExtensions(courseId, 'enable', extensions, function(error, result) {
        if (error) {
          logger.log('info', 'error = ' + error);
          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
          res.json({ success: false, message: error.message });
          return res.end();
        }

        res.statusCode = 200;
        res.json({success: true});
        return res.end();

      });

    });

  });

  // add content creation hooks for each viable content type
  ['contentobject', 'article', 'block', 'component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('create', contentType, contentCreationHook.bind(null, contentType));
  });
}

/**
 * retrieves an array of extensiontype items that have been enabled on a particular course
 *
 * @param {string} courseId
 * @param {callback} cb
 */
function getEnabledExtensions(courseId, cb) {
  database.getDatabase(function (error, db) {
    if (error) {
      return cb(error);
    }

    // should we delegate this feature to the config plugin?
    db.retrieve('config', { _courseId: courseId }, function (error, results) {
      if (error) {
        return cb(error);
      }

      if (!results || 0 === results.length) {
        logger.log('info', 'could not retrieve config for course ' + courseId);
        return cb(null, []);
      }

      // get the extensions based on the _enabledExtensions attribute
      var extIds = [];
      var enabledExtensions = results[0]._enabledExtensions;
      enabledExtensions && Object.keys(enabledExtensions).forEach(function (key) {
        extIds.push(enabledExtensions[key]._id);
      });
      db.retrieve('extensiontype', { _id: { $in: extIds } }, cb);
    });
  });
}

/**
 * hook to modify a newly created content item based on enabled extensions for a course
 *
 * @param {string} contentType
 * @param {array} data
 * @param {callback} cb
 */
function contentCreationHook (contentType, data, cb) {
  // in creation, data[0] is the content
  var contentData = data[0];
  if (!contentData._courseId) {
    // cannot do anything for unknown courses
    return cb(null, data);
  }

  getEnabledExtensions(contentData._courseId, function (error, extensions) {
    if (error) {
      // permit content creation to continue, but log error
      logger.log('error', 'could not load extensions: ' + error.message);
      return cb(null, data);
    }

    // _extensions is undefined at this point
    contentData._extensions = {};
    extensions.forEach(function (extensionItem) {
      var schema = extensionItem.properties.pluginLocations.properties[contentType].properties; // yeesh
      var generatedObject = generateExtensionProps(schema, extensionItem.name, extensionItem.version, contentType);
      contentData._extensions = _.extend(contentData._extensions, generatedObject);
    });

    // assign back to passed args
    data[0] = contentData;
    return cb(null, data);
  });
}

/**
 * function generates an object from json schema - could not find a lib to do this for me :-\
 * if anyone knows of a node lib to generate an object from a json schema, please fix this!
 * based on http://stackoverflow.com/questions/13028400/json-schema-to-javascript-typed-object#answer-16457667
 *
 */
function generateExtensionProps (schema, id, version, location) {
  if (!this.memo) {
    this.memo = Object.create(null);
  }

  // check if we have already built this object
  var identifier = id + '#' + version + '/' + location;
  if (this.memo[identifier]) {
    return this.memo[identifier];
  }

  var walkObject = function (props) {
    var child = {};
    Object.keys(props).forEach(function (key) {
      switch (props[key].type) {
        case "boolean":
        case "integer":
        case "number":
        case "string":
          child[key] = props[key].default || null;
          break;
        case "array":
          child[key] = [];
          break;
        case "object":
          child[key] = walkObject(props[key].properties);
          break;
        default:
          break;
      }
    });

    return child;
  };

  // memoize the result
  if (schema) {
    this.memo[identifier] = walkObject(schema);
    return this.memo[identifier];
  }

  return false;
}

/**
 * async loop through extensions, add/remove extension JSON from content
 *
 * @params courseId {string}
 * @params action {string}
 * @params extensions {object} [extension IDs]
 * @param {callback} cb
*/

function toggleExtensions (courseId, action, extensions, cb) {
  if (!extensions || 'object' !== typeof extensions) {
    return cb(error);
  }

  database.getDatabase(function (err, db) {
    if (err) {
      return cb(err);
    }


    // retrieves specified components for the course and either adds or deletes
    // extension properties of the passed extensionItem
    var updateComponentItems = function (componentType, schema, extensionItem, nextComponent) {
      var criteria = 'course' == componentType ? { _id : courseId } : { _courseId : courseId };
      db.retrieve(componentType, criteria, { fields: '_id _extensions _enabledExtensions' }, function (err, results) {
        if (err) {
          return cb(err);
        }

        var generatedObject = generateExtensionProps(schema, extensionItem.name, extensionItem.version, componentType);
        var targetAttribute = extensionItem.targetAttribute;
        // iterate components and update _extensions attribute
        async.each(results, function (component, next) {
          var isConfig = ('config' == componentType);
          var updatedExtensions = component._extensions || {};
          var enabledExtensions = component._enabledExtensions || {};
          if ('enable' == action) {
            // we need to store extra in the config object
            if (isConfig) {
              enabledExtensions[extensionItem.extension] = {
                _id: extensionItem._id,
                version: extensionItem.version,
                targetAttribute: targetAttribute
              };
            }
            updatedExtensions = _.extend(updatedExtensions, generatedObject);
          } else {
            // remove from list of enabled extensions in config object
            if (isConfig) {
              delete enabledExtensions[extensionItem.extension];
            }

            generatedObject && (delete updatedExtensions[targetAttribute]);
          }

          // update using delta
          var delta = { _extensions : updatedExtensions };
          if (isConfig) {
            delta._enabledExtensions = enabledExtensions;
          }
          db.update(componentType, { _id: component._id }, delta, next);
        }, nextComponent);
      });
    };

    db.retrieve('extensiontype', { _id: { $in: extensions } }, function (err, results) {
      if (err) {
        return cb(err);
      }

      async.eachSeries(results, function (extensionItem, nextItem) {
        var locations = extensionItem.properties.pluginLocations.properties;
        async.eachSeries(Object.keys(locations), function (key, nextLocation) {
          updateComponentItems(key, locations[key].properties, extensionItem, nextLocation);
        }, nextItem);
      }, cb);
    });
  });
}

/**
 * this will retrieve a list of extensions that have been installed on the system
 * if there are no extensions, it will make a single attempt to install extensions
 * and then send the list via the callback
 *
 * @param {object} [options] { refresh: int, retry: boolean }
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
      if (options.refresh || ((!results || 0 === results.length) && options.retry)) {
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
          targetAttribute: pkgMeta.targetAttribute,
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
