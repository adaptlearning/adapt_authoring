/**
 * Component content plugin
 *
 * The component plugin is a bit more complex than other content plugins,
 * since it needs to manage any kind of adapt component that has been
 * published to our bower repository.
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
    _ = require('underscore'),
    util = require('util'),
    path = require('path');

function Component () {
}

util.inherits(Component, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Component.prototype.getModelName = function () {
  return 'component';
};

/**
 * returns the child type for this object
 *
 * @return string
 */
Component.prototype.getChildType = function () {
  return false; // no children evAr!
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 */
Component.prototype.onDatabaseCreated = function (db) {
  var schemaPath = path.join(__dirname, 'componenttype.schema');
  try {
    var schema = fs.readFileSync(schemaPath);
    schema = JSON.parse(schema);
    db.addModel('componenttype', schema);
  } catch (error) {
    logger.log('error', 'failed to parse schema file at ' + schemaPath, error);
  }

  ContentPlugin.prototype.onDatabaseCreated.call(this, db);
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
    // add componenttype list route
    rest.get('/componenttype', function (req, res, next) {
      fetchInstalledComponents(function (err, results) {
        if (err) {
          return next(err);
        }

        // only send the latest version of the components
        var components = {};
        async.eachSeries(results, function (item, cb) {
          if ('object' !== typeof components[item.name]) {
            components[item.name] = item;
          } else if (versionCompare(components[item.name].version, item.version) < 0) {
            components[item.name] = item;
          }

          cb(null);
        },
        function (err) {
          if (err) {
            return next(err);
          }

          return res.json(_.values(components));
        });
      });
    });

    // get a single componenttype definition by id
    rest.get('/componenttype/:id', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve('componenttype', { _id: req.params.id }, function (err, results) {
          if (err) {
            return next(err);
          }

          // want to return one only
          if (results && 1 === results.length) {
            return res.json(results[0]);
          }

          res.statusCode = 404;
          return res.json({ success: false, message: 'could not find component type' });
        });
      });
    });

  });
}

/**
 * this will retrieve a list of components that have been installed on the system
 * if there are no components, it will make a single attempt to install components
 * and then send the list via the callback
 *
 * @param {object} [options]
 * @param {callback} cb
 */
function fetchInstalledComponents (options, cb) {
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

    db.retrieve('componenttype', {}, function (err, results) {
      if (err) {
        return cb(err);
      }

      // there should be at least one installed component
      if ((!results || 0 === results.length) && options.retry) {
        // update components, retry, return
        return updateComponentTypes(function (err) {
          if (err) {
            return cb(err);
          }

          // try again, but only once
          fetchInstalledComponents({ retry: false }, cb);
        });
      }

      return cb(null, results);
    });
  });
}

/**
 * adds a new componenttype to the system - fired after bower
 * has installed the component code to the component cache
 *
 * @param {object} componentInfo - the bower package info retrieved during install
 * @param {callback} cb
 */
function addComponentType(componentInfo, cb) {
  // verify componentInfo meets requirements
  var pkgMeta = componentInfo.pkgMeta;
  if (!pkgMeta.version) { // don't allow components that don't define versions
    logger.log('warn', 'ignoring unversioned component: ' + pkgMeta.name);
    return cb(null);
  }

  var schemaPath = path.join(componentInfo.canonicalDir, defaultOptions._adaptSchemaFile);
  fs.exists(schemaPath, function (exists) {
    if (!exists) {
      logger.log('warn', 'ignoring component with no schema: ' + pkgMeta.name);
      return cb(null);
    }

    fs.readFile(schemaPath, function (err, data) {
      var schema = false;
      if (err) {
        logger.log('error', 'failed to parse component schema for ' + pkgMeta.name, data);
        return cb(err);
      }
      try {
        schema = JSON.parse(data);
      } catch (e) {
        logger.log('error', 'failed to parse component schema for ' + pkgMeta.name, data);
        return cb(e);
      }

      // add the component to the componenttypes collection
      database.getDatabase(function (err, db) {
        if (err) {
          return cb(err);
        }

        // add component type
        var componentType = {
          name: pkgMeta.name,
          displayName: pkgMeta.displayName,
          component: pkgMeta.component,
          version: pkgMeta.version,
          properties: schema.properties
        };

        // don't duplicate component.name, component.version
        db.retrieve('componenttype', { name:componentType.name, version:componentType.version }, function (err, results) {
          if (err) {
            return cb(err);
          }

          if (results && 0 !== results.length) {
            // don't add duplicate
            logger.log('silly', 'ignoring duplicate component version', componentType);
            return cb(null);
          }

          db.create('componenttype', componentType, function (err, results) {
            if (err) {
              // don't error out if we didn't add the component, just notify
              logger.log('error', 'Failed to add component: ' + pkgMeta.name, err);
              return cb(null);
            }

            return cb(null, results);
          });
        });
      });
    });
  });
}

/**
 * this function uses bower to search and install new adapt framework
 * components to the authoring tool
 *
 * @param {object} options - bower configuration and local config options
 * @param {callback} cb
 */
function updateComponentTypes (options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }

  // log the update with any passed options
  logger.log('info', 'updating component types', options);

  options = _.extend(defaultOptions, options);
  // update directory relative to server location
  options.cwd = configuration.serverRoot;

  // clean our bower cache
  rimraf(options.directory, function (err) {
    if (err) {
      return cb(err);
    }

    // now do search and install
    bower.commands
      .search('', options) // search all components or only contrib?
      .on('end', function (results) {
        // lets bower install each
        async.map(results, function (item, next) { next(null, item.name); }, function (err, nameList) {
        logger.log('info', 'fetched components from bower repository');
          bower.commands
            .install(nameList, { save: true }, options)
            .on('error', cb)
            .on('end', function (componentInfo) {
              // add details for each to the db
              async.eachSeries(Object.keys(componentInfo), function (key, next) {
                addComponentType(componentInfo[key], next);
              },
              cb);
            });
        });
      });
  });
}

// setup components
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Component;
