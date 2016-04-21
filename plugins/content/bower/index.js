// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Bower content plugin
 *
 * The bower plugin is a bit more complex than other content plugins,
 * since it needs to manage any kind of adapt component that has been
 * published to our bower repository. This module is intended to be inherited
 * and extended by the various bower content plugins (components, extensions, themes, menus)
 */

var origin = require('../../../'),
    contentmanager = require('../../../lib/contentmanager'),
    usermanager = require('../../../lib/usermanager'),
    rest = require('../../../lib/rest'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    permissions = require('../../../lib/permissions'),
    helpers = require('../../../lib/helpers'),
    database = require('../../../lib/database'),
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    rimraf = require('rimraf'),
    async = require('async'),
    semver = require('semver'),
    fs = require('fs'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    util = require('util'),
    path = require('path'),
    unzip = require('unzip'),
    exec = require('child_process').exec,
    IncomingForm = require('formidable').IncomingForm,
    version = require('../../../version.json');

// errors
function PluginPackageError (msg) {
  this.type = 'PluginPackageError';
  this.message = msg || 'Error with plugin package';
}

util.inherits(PluginPackageError, Error);

function BowerPlugin () {
}

util.inherits(BowerPlugin, ContentPlugin);

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
BowerPlugin.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  helpers.hasCoursePermission(action, userId, tenantId, contentItem, function(err, isAllowed) {
    if (err) {
      return next(err);
    }

    if (!isAllowed) {
      // Check the permissions string
      var resource = permissions.buildResourceString(tenantId, '/api/content/course/' + contentItem._courseId);
      permissions.hasPermission(userId, action, resource, next);
    } else {
      return next(null, isAllowed);
    }
  });
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
BowerPlugin.prototype.getModelName = function () {
  return false;
};

/**
 * returns the plugin type identifier for this plugin
 *
 * @return {string}
 */
BowerPlugin.prototype.getPluginType = function () {
  return false;
};

/**
 * returns the child type for this object
 *
 * @return string
 */
BowerPlugin.prototype.getChildType = function () {
  return false; // no children evAr!
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 * @param {callback} next
 */
BowerPlugin.prototype.onDatabaseCreated = function (db, next) {
  var modelName = this.getModelName();

  var pluginType = this.getPluginType();
  if (!modelName || !pluginType) {
    return next(null);
  }

  var schemaPath = path.join(configuration.serverRoot, 'plugins', 'content', modelName, pluginType + '.schema');
  try {
    fs.readFile(schemaPath, function (err, data) {
      if (err) {
        return next(err);
      }

      var schema = JSON.parse(data);
      db.addModel(pluginType, schema);
      return next();
    });
  } catch (error) {
    logger.log('error', 'failed to parse schema file at ' + schemaPath, error);
    return next(error);
  }
};

/**
 * returns the package type managed by this plugin (component, theme, etc)
 *
 */
BowerPlugin.prototype.getPackageType = function () {
  return false;
};

/**
 * extracts the plugin type from a bower.json
 * @param {object} packageJson - a require'd bower.json file
 * @return {string} - the plugin type
 */
function extractPluginType (packageJson) {
  // not very intelligent
  var pluginTypes = ['theme', 'extension', 'component', 'menu'];
  var type = false;
  for (var index = 0; index < pluginTypes.length; ++index) {
    type = pluginTypes[index];
    if (packageJson[type] && 'string' === typeof packageJson[type]) {
      return type;
    }
  }

  return false;
}

/**
 * extracts the necessary attributes to store a package in the DB
 *
 */
function extractPackageInfo (plugin, pkgMeta, schema) {
  // build package info
  var info = {
    name: pkgMeta.name,
    displayName: pkgMeta.displayName,
    description: pkgMeta.description,
    version: pkgMeta.version,
    framework: pkgMeta.framework ? pkgMeta.framework : null,
    homepage: pkgMeta.homepage ? pkgMeta.homepage : null,
    issues: pkgMeta.issues ? pkgMeta.issues : null,
    isLocalPackage: pkgMeta.isLocalPackage ? pkgMeta.isLocalPackage : false,
    properties: schema.properties,
    globals: schema.globals ? schema.globals : null
  };

  if (pkgMeta.assetFields) {
    info.assetFields = pkgMeta.assetFields;
  }

  // set the type and package id for the package
  info[plugin.packageType] = pkgMeta[plugin.packageType];

  // set extra properties
  plugin.extra && plugin.extra.forEach(function (key) {
    if (pkgMeta[key]) {
      info[key] = pkgMeta[key];
    }
  });

  return info;
}

/**
 * essential setup for this plugin
 */

function initialize () {
  var app = origin();
  app.once('serverStarted', function (server) {
    // add plugin upload route
    rest.post('/upload/contentplugin', handleUploadedPlugin);
  });
}

/**
 * the default endpoint for PUT /api/{plugintype}/
 *
 */

BowerPlugin.prototype.updatePluginType = function (req, res, next) {
  var self = this;
  var delta = _.pick(req.body, '_isAvailableInEditor'); // only allow update of certain attributes

  database.getDatabase(function (err, db) {
    if (err) {
      return next(err);
    }

    db.update(self.getPluginType(), { _id: req.params.id }, delta, function (err) {
      if (err) {
        return next(err);
      }

      return res.json({ success: true });
    });
  });
};

/**
 * essential setup for derived plugins
 *
 */
BowerPlugin.prototype.initialize = function (plugin) {
  var app = origin();
  var self = this;
  app.once('serverStarted', function (server) {
    // Add the componenttype/extensiontype/menutype/themetype route
    rest.get('/' + plugin.type, function (req, res, next) {
      var options = _.extend(plugin.options, _.pick(req.query, 'refreshplugins', 'showall'));

      if (!req.params.refreshplugins) {
        database.getDatabase(function (err, db) {
          if (err) {
            return next(err);
          }

          // Check if requests are on the master tenant
          var currentUser = usermanager.getCurrentUser();
          var isMasterTenantUser = currentUser
            ? currentUser.tenant.isMaster
            : false;

          // Users on the master tenant should be able to see all plugins
          var criteria = !isMasterTenantUser
            ? {_isAvailableInEditor: true}
            : {};

          db.retrieve(plugin.type, criteria, function (err, results) {
            if (err) {
              return next(err);
            }

            res.statusCode = 200;
            return res.json(results);
          });
        }, configuration.getConfig('dbName'));
      } else {
        // we only want to fetch the latest versions
        options.latest = true;

        self.fetchInstalledPackages(plugin, options, function (err, results) {
          if (err) {
            return next(err);
          }

          res.statusCode = 200;
          return res.json(results);
        });
      }

    });

    // get a single pluginType definition by id
    rest.get('/' + plugin.type + '/:id', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        var options = db.isValidIdentifier(req.params.id)
          ? { _id: req.params.id }
          : { name: req.params.id}

        db.retrieve(plugin.type, options, function (err, results) {
          if (err) {
            return next(err);
          }

          // want to return one only
          if (results && 1 === results.length) {
            return res.json(results[0]);
          }

          res.statusCode = 404;
          return res.json({ success: false, message: 'could not find plugin' });
        });
      }, configuration.getConfig('dbName'));
    });

    // update a single plugin type definition by id
    rest.put('/' + plugin.type + '/:id', function (req, res, next) {
      app.contentmanager.getContentPlugin(plugin.packageType, function (err, plugin) {
        if (err) {
          return next(err);
        }

        if (plugin && plugin.updatePluginType) {
          return plugin.updatePluginType(req, res, next);
        }

        return BowerPlugin.prototype.call(null, req, res, next);
      });
    });

    // check if a higher version is available for the plugin
    rest.get('/' + plugin.type + '/checkversion/:id', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve(plugin.type, { _id: req.params.id }, function (err, results) {
          if (err) {
            return next(err);
          }

          if (!results || 1 !== results.length) {
            res.statusCode = 404;
            return res.json({ success: false, message: 'could not find plugin' });
          }

          checkIfHigherVersionExists(results[0], plugin.options, function (err, exists) {
            return res.json({ success:true, isUpdateable: exists });
          });
        });
      }, configuration.getConfig('dbName'));
    });

    // upgrade a plugin/plugins
    rest.post('/' + plugin.type + '/update', function (req, res, next) {
      var upgradeTargets = req.body.targets;
      if (!util.isArray(upgradeTargets)) {
        res.statusCode = 400;
        return res.json({ success: false, message: 'targets parameter should be an array' });
      }

      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve(plugin.type, { _id: { $in: upgradeTargets} }, function (err, results) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          if (!results || 0 === results.length) {
            res.statusCode = 404;
            return res.json({ success: false, message: 'could not find plugin(s)' });
          }

          async.map(
            results,
            function (item, cb) {
              return cb(null, item.name);
            },
            function (err, pluginNames) {
              if (err) {
                return next(err);
              }

              // bower throws a fit if passing an array of size 1 :\
              if (pluginNames.length === 1) {
                pluginNames = pluginNames[0];
              }

              var options = _.extend(
                plugin.options,
                { _searchItems: pluginNames }
              );

              return self.updatePackages(plugin, options, function () {
                // @TODO figure out how to determine if the update failed?
                return res.json({ success: true, upgraded: upgradeTargets });
              });
            });
        });
      }, configuration.getConfig('dbName'));
    });
  });
};

/**
 * this will retrieve a list of bower plugins that have been installed on the system
 * if there are no plugins, it will make a single attempt to install them
 * and then send the list via the callback
 *
 * @param {object} [options] {refresh: int, retry: boolean}
 * @param {callback} next
 */
BowerPlugin.prototype.fetchInstalledPackages = function (plugin, options, next) {
  var self = this;
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  options = _.extend({
      retry: true
    }, defaultOptions, options);

  database.getDatabase(function (err, db) {
    if (err) {
      return next(err);
    }

    db.retrieve(plugin.type, {}, function (err, results) {
      if (err) {
        return next(err);
      }

      // there should be at least one installed
      if (options.refreshplugins || ((!results || 0 === results.length) && options.retry)) {
        // update plugins retry, return
        return self.updatePackages(plugin, options, function (err) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          // Try again, but only once
          options.retry = false;
          options.refreshplugins = false;
          self.fetchInstalledPackages(plugin, options, next);
        });
      }

      if (options.latest) {
        // only send the latest version of the packages
        var packages = {};
        return async.eachSeries(results, function (item, cb) {
          if (!options.showall && !item._isAvailableInEditor) {
            return cb(null);
          }

          if ('object' !== typeof packages[item.name]) {
            packages[item.name] = item;
          } else if (semver.lt(packages[item.name].version, item.version)) {
            packages[item.name] = item;
          }

          cb(null);
        },
        function (err) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          return next(null, packages);
        });
      }

      // send all packages
      return next(null, results);
    });
  });
};

/**
 * adds a new package to the system - fired after bower
 * has installed to the cache
 *
 * @param {object} plugin - bowerConfig object for a bower plugin type
 * @param {object} packageInfo - the bower package info retrieved during install
 * @param {object} options
 * @param {callback} cb
 */
function addPackage (plugin, packageInfo, options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {
      strict: false
    };
  }

  // verify packageInfo meets requirements
  var pkgMeta = packageInfo.pkgMeta;
  if (pkgMeta.keywords) { // only allow our package type
    var keywords = _.isArray(pkgMeta.keywords) ? pkgMeta.keywords : [pkgMeta.keywords];
    if (!_.contains(keywords, plugin.keywords)) {
      if (options.strict) {
        return cb(new PluginPackageError('Package is not a valid ' + plugin.type + ' package'));
      }

      logger.log('info', 'ignoring unsupported package: ' + pkgMeta.name);
      return cb(null);
    }
  } else {
    if (options.strict) {
      return cb(new PluginPackageError('Package does not define any keywords'));
    }

    logger.log('warn', 'ignoring component without keywords defined: ' + pkgMeta.name);
    return cb(null);
  }

  if (!pkgMeta.version) { // don't allow packages that don't define versions
    logger.log('warn', 'ignoring unversioned component: ' + pkgMeta.name);
    return cb(null);
  }

  var schemaPath = path.join(packageInfo.canonicalDir, defaultOptions._adaptSchemaFile);
  fs.exists(schemaPath, function (exists) {
    if (!exists) {
      if (options.strict) {
        return cb(new PluginPackageError('Package does not contain a schema'));
      }

      logger.log('warn', 'ignoring package with no schema: ' + pkgMeta.name);
      return cb(null);
    }

    fs.readFile(schemaPath, function (err, data) {
      var schema = false;
      if (err) {
        if (options.strict) {
          return cb(new PluginPackageError('Failed to parse schema for package ' + pkgMeta.name));
        }

        logger.log('error', 'failed to parse schema for ' + pkgMeta.name, err);
        return cb(null);
      }

      try {
        schema = JSON.parse(data);
      } catch (e) {
        if (options.strict) {
          return cb(new PluginPackageError('Failed to parse schema for package ' + pkgMeta.name));
        }

        logger.log('error', 'failed to parse schema for ' + pkgMeta.name, e);
        return cb(null);
      }

      // @TODO - this should be removed when we move to symlinked plugins :-\
      if (!options.skipTenantCopy) {
        // Copy this version of the component to a holding area (used for publishing).
        // Folder structure: <versions folder>/adapt-contrib-graphic/0.0.2/adapt-contrib-graphic/...
        var destination = path.join(plugin.options.versionsFolder, pkgMeta.name, pkgMeta.version, pkgMeta.name);
        rimraf(destination, function(err) {
          if (err) {
            // can't continue
            return logger.log('error', err);
          }

          mkdirp(destination, function (err) {
            if (err) {
              return logger.log('error', err);
            }

            // move from the cache to the versioned dir
            ncp(packageInfo.canonicalDir, destination, function (err) {
              if (err) {
                // don't double call callback
                return logger.log('error', err);
              }

              // temporary hack to get stuff moving
              // copy plugin source to tenant dir
              var currentUser = usermanager.getCurrentUser();
              var tenantId = options.tenantId
                ? options.tenantId
                : currentUser.tenant._id.toString()
              var tenantPluginPath = path.join(
                configuration.tempDir,
                tenantId,
                'adapt_framework',
                'src',
                plugin.srcLocation,
                pkgMeta.name
              );

              // remove older version first
              rimraf(tenantPluginPath, function (err) {
                if (err) {
                  return logger.log('error', err);
                }

                ncp(packageInfo.canonicalDir, tenantPluginPath, function (err) {
                  if (err) {
                    return logger.log('error', err);
                  }

                  // done
                  logger.log('info', 'Successfully copied ' + pkgMeta.name + ' to tenant ' + tenantPluginPath);
                });
              });
            });
          });
        });
      }

      // build the package information
      var package = extractPackageInfo(plugin, pkgMeta, schema);
      // add the package to the modelname collection
      database.getDatabase(function (err, db) {
        if (err) {
          logger.log('error', err);
          return cb(err);
        }

        // don't duplicate component.name, component.version
        db.retrieve(plugin.type, { name: package.name, version: package.version }, function (err, results) {
          if (err) {
            logger.log('error', err);
            return cb(err);
          }

          if (results && 0 !== results.length) {
            // don't add duplicate
            if (options.strict) {
              return cb(new PluginPackageError("Can't add plugin: plugin already exists!"));
            }
            return cb(null);
          }

          db.create(plugin.type, package, function (err, newPlugin) {
            if (err) {
              if (options.strict) {
                return cb(err);
              }

              logger.log('error', 'Failed to add package: ' + package.name, err);
              return cb(null);
            }

            logger.log('info', 'Added package: ' + package.name);

            // #509 update content targeted by previous versions of this package
            logger.log('info', 'searching old package types ... ');
            db.retrieve(plugin.type, { name: package.name, version: { $ne: newPlugin.version } }, function (err, results) {

              if (err) {
                // strictness doesn't matter at this point
                logger.log('error', 'Failed to retrieve previous packages: ' + err.message, err);
              }

              if (results && results.length) {
                // found previous versions to update
                // only update content using the id of the most recent version
                var oldPlugin = false;
                results.forEach(function (item) {
                  if (!oldPlugin) {
                    oldPlugin = item;
                  } else if (semver.gt(item.version, oldPlugin.version)) {
                    oldPlugin = item;
                  }
                });

                // Persist the _isAvailableInEditor flag.
                db.update(plugin.type, {_id: newPlugin._id}, {_isAvailableInEditor: oldPlugin._isAvailableInEditor}, function(err, results) {
                  if (err) {
                    logger.log('error', err);
                    return cb(err);
                  }
                  
                  plugin.updateLegacyContent(newPlugin, oldPlugin, function (err) {
                    if (err) {
                      logger.log('error', err);
                      return cb(err);
                    }

                    // Remove older versions of this plugin
                    db.destroy(plugin.type, { name: package.name, version: { $ne: newPlugin.version } }, function (err) {
                      if (err) {
                        logger.log('error', err);
                        return cb(err);
                      }

                      logger.log('info', 'Successfully removed versions of ' + package.name + '(' + plugin.type + ') older than ' + newPlugin.version);
                      return cb(null, newPlugin);
                    });
                  });
                });
              } else {
                // nothing to do!
                // Remove older versions of this plugin
                db.destroy(plugin.type, { name: package.name, version: { $ne: newPlugin.version } }, function (err) {
                  if (err) {
                    logger.log('error', err);
                    return cb(err);
                  }

                  logger.log('info', 'Successfully removed versions of ' + package.name + '(' + plugin.type + ') older than ' + newPlugin.version);

                  return cb(null, newPlugin);
                });
              }
            });
          });
        });
      }, options.tenantId);
    });
  });
}

/**
 * this function uses bower to search and install new adapt framework
 * packages to the authoring tool
 *
 * @param {object} options - bower configuration and local config options
 * @param {callback} cb
 */
BowerPlugin.prototype.updatePackages = function (plugin, options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {
      '_searchItems': ''
    };
  }

  options = _.extend(
    _.clone(defaultOptions),
    options
  );

  // log the update with any passed options
  logger.log('info', 'updating packages', options);

  // update directory relative to server location
  options.cwd = configuration.serverRoot;

  // clean our bower cache
  rimraf(options.directory, function (err) {
    if (err) {
      return cb(err);
    }

    // now do search and install
    bower.commands
      .search(options._searchItems, options)
      .on('error', function(err) {
        logger.log('error', err);
        return cb(err);
      })
      .on('end', function (results) {
        // lets bower install each
        async.map(results,
          function (item, next) {
            next(null, item.name);
          },
          function (err, nameList) {
            bower
              .commands
              .install(nameList, { save: true }, options)
              .on('error', function(err) {
                logger.log('error', err);
                return cb(err);
              })
              .on('end', function (packageInfo) {
                // add details for each to the db
                async.eachSeries(
                  Object.keys(packageInfo),
                  function (key, next) {
                    if (packageInfo[key].pkgMeta.framework) {
                      // If the plugin defines a framework, ensure that it is compatible
                      if (semver.satisfies(semver.clean(version.adapt_framework), packageInfo[key].pkgMeta.framework)) {
                        addPackage(plugin, packageInfo[key], options, next); 
                      } else {
                        logger.log('warn', 'Unable to install ' + packageInfo[key].pkgMeta.name + ' as it is not supported in the current version of of the Adapt framework');
                        next();
                      }
                    } else {
                      addPackage(plugin, packageInfo[key], options, next);
                    }
                  },
                  cb);
              });
          });
      });
  });
};

/**
 * checks if a higher version of an installed extension is available
 *
 */
function checkIfHigherVersionExists (package, options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }

  var packageName = package.name;

  options = _.extend(
    _.clone(defaultOptions),
    options
  );

  // Query bower to verify that the specified plugin exists.
  bower.commands.search(packageName, options)
    .on('error', function(err) {
      logger.log('error', err);
      return cb(null, false);
    })
    .on('end', function (results) {
      if (!results || results.length == 0) {
        logger.log('warn', 'Plugin ' + packageName + ' not found!');
        return cb('Plugin ' + packageName + ' not found!');
      }

      bower.commands.install([packageName], null, options) // Removed #develop tag
      .on('end', function (info) {
        // if info is empty, it means there is no higher version of the plugin available
        if (Object.getOwnPropertyNames(info).length == 0 || !info[packageName].pkgMeta) {
          return cb(null, false);
        }

        // Semver check that the plugin is compatibile with the installed version of the framework
        if (info[packageName].pkgMeta.framework) {
            // Check which version of the framework we're running
            if (semver.satisfies(semver.clean(version.adapt_framework), info[packageName].pkgMeta.framework)) {
              return cb(null, true);
            } else {
              logger.log('warn', 'A later version of ' + packageName + ' is available but is not supported by the installed version of the Adapt framework');
              return cb(null, false);
            }
        } else {
          return cb(null, true);
        }
      })
      .on('error', function(err) {
        logger.log('error', err);
        return cb(null, false);
      });
    });

}

/**
 * handles uploaded plugins
 *
 */

function handleUploadedPlugin (req, res, next) {
  var form = new IncomingForm();
  form.parse(req, function (error, fields, files) {
    if (error) {
      return next(error);
    }

    var file = files.file;
    if (!file || !file.path) {
      return next(new PluginPackageError('File upload failed!'));
    }

    // try unzipping
    var outputPath = file.path + '_unzipped';
    var rs = fs.createReadStream(file.path);
    var ws = unzip.Extract({ path: outputPath });
    rs.on('error', function (error) {
      return next(error);
    });
    ws.on('error', function (error) {
      return next(error);
    });
    ws.on('close', function () {
      // enumerate output directory and search for bower.json
      fs.readdir(outputPath, function (err, files) {
        if (err) {
          return next(err);
        }

        var packageJson;
        var canonicalDir;

        // Read over each directory checking for the correct one that contains a bower.json file
        fs.readdir(outputPath, function (err, directoryList) {

          async.some(directoryList, function(directory, asyncCallback) {
            var bowerPath = path.join(outputPath, directory, 'bower.json');

            fs.exists(bowerPath, function(exists) {
              if (exists) {
                canonicalDir = path.join(outputPath, directory);
                try {
                  packageJson = require(bowerPath);
                } catch (error) {
                  logger.log('error', 'failed to find bower file at ' + bowerPath, error);
                  return asyncCallback();
                }
                asyncCallback(true);
              } else {
                asyncCallback();
              }
            });

          }, function(hasResults) {
            if (!hasResults) {
              return next(new PluginPackageError('Cannot find expected bower.json file in the plugin root, please check the structure of your zip file and try again.'));
            }

            if (!packageJson) {
              return next(new PluginPackageError('Unrecognized plugin - a plugin should have a bower.json file'));
            }

            // extract the plugin type from the package
            var pluginType = extractPluginType(packageJson);
            if (!pluginType) {
              return next(new PluginPackageError('Unrecognized plugin type for package ' + packageJson.name));
            }

            // mark as a locally installed package
            packageJson.isLocalPackage = true;

            // construct packageInfo
            var packageInfo = {
              canonicalDir: canonicalDir,
              pkgMeta: packageJson
            };

            // Check if the framework has been defined on the plugin and that it's not compatible
            if (packageInfo.pkgMeta.framework && !semver.satisfies(semver.clean(version.adapt_framework), packageInfo.pkgMeta.framework)) {
              return next(new PluginPackageError('This plugin is incompatible with version ' + version.adapt_framework + ' of the Adapt framework'));
            }

            app.contentmanager.getContentPlugin(pluginType, function (error, contentPlugin) {
              if (error) {
                return next(error);
              }

              addPackage(contentPlugin.bowerConfig, packageInfo, { strict: true }, function (error, results) {
                if (error) {
                  return next(error);
                }

                res.statusCode = 200;
                return res.json({ success: true, pluginType: pluginType, message: 'successfully added new plugin' });
              });
            });

          });

        });

      });
    });
    rs.pipe(ws);

    // response should be sent by one of the above handlers
  });
}

initialize();

/**
 * Module exports
 *
 */

exports = module.exports = BowerPlugin;
