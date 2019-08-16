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
    async = require('async'),
    semver = require('semver'),
    fs = require('fs-extra'),
    _ = require('underscore'),
    util = require('util'),
    path = require('path'),
    unzip = require('unzip'),
    exec = require('child_process').exec,
    IncomingForm = require('formidable').IncomingForm,
    installHelpers = require('../../../lib/installHelpers'),
    bytes = require('bytes');

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
    targetAttribute: pkgMeta.targetAttribute,
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
  // HACK to allow framework import helpers to use this function. Should surface this properly somewhere
  app.bowermanager.addPackage = addPackage;

  app.once('serverStarted', function (server) {
    // add plugin upload route
    rest.post('/upload/contentplugin', handleUploadedPlugin);

    //Remove plugins
    ['extensiontype', 'componenttype', 'themetype', 'menutype'].forEach(function (type) {
      rest.delete('/' + type + '/:id', function (req, res, next) {
        const id = req.params.id;
        const user = usermanager.getCurrentUser();

        permissions.hasPermission(user._id, 'delete', '*', function (isAllowed) {
          if (!isAllowed) {
            return res.status(401).json({
              success: false,
              message: app.polyglot.t('app.errorpermission')
            });
          }

          database.getDatabase(function (err, db) {
            if (err) {
              return next(err);
            }

            db.retrieve(type, {_id: id}, function (err, doc) {
              if (err) {
                return next(err);
              }

              if (doc.length !== 1) {
                return res.status(404).json({success: false, message: id + ' not found'});
              }

              //There is only one document in the collection so we can move it to the root for ease of use
              doc = doc[0];

              async.parallel(
                [
                  function (callback) {
                    fs.remove(path.join(__dirname, '..', type.replace('type', ''), 'versions', doc.name), callback);
                  },
                  function (callback) {
                    var pluginType = type.replace('type', '');
                    if (pluginType === 'component' || pluginType === 'extension') pluginType = pluginType + 's';
                    fs.remove(path.join(__dirname, '..', '..', '..', 'temp', configuration.getConfig('masterTenantID'), 'adapt_framework', 'src', pluginType, doc.name), callback);
                  },
                  function (callback) {
                    fs.remove(path.join(__dirname, '..', '..', 'content', 'bower', 'bowercache', doc.name), callback);
                  },
                  function (callback) {
                    db.destroy(type, {_id: id}, callback);
                  },
                  function (callback) {
                    if (type !== 'themetype') return callback();
                    db.destroy('themepreset', {parentTheme: doc.theme}, callback);
                  }
                ],
                function (err) {
                  if (err) {
                    return next(err);
                  }

                  return res.status(200).json({success: true});
                }
              );
            });
          });
        });
      });
    });


    //Returns a list of courses using the requested plugin
    rest.get('/:type/:id/uses', function (req, res, callback) {
      const id = req.params.id;
      const type = req.params.type;
      const user = usermanager.getCurrentUser();

      if (['extensiontype', 'componenttype', 'themetype', 'menutype'].indexOf(type) === -1) {
        return res.status(403).json({success: false, message: 'Invalid type'});
      }

      permissions.hasPermission(user._id, 'delete', '*', function (isAllowed) {
        if (!isAllowed) {
          return res.status(401).json({success: false, message: app.polyglot.t('app.errorpermission')});
        }

        let typeObject;
        try {
          typeObject = require('../' + type.replace('type', '') + '/index.js');
        } catch (err) {
          return callback(err);
        }

        typeObject.prototype.getUses(function (err, courses) {
          if (err) {
            return callback(err);
          }

          const returnData = [];
          const userCache = {}
          async.each(courses, function (course, callback) {
            const shortCourse = {}
            shortCourse._id = course._id
            shortCourse.title = course.title

            database.getDatabase(function (err, db) {
              if (err) {
                return callback(err);
              }
              if (typeof userCache[course.createdBy] === 'string') {
                shortCourse.createdByEmail = userCache[course.createdBy]
                return callback();
              }

              db.retrieve('user', {_id: course.createdBy}, function (err, users) {
                if (err) {
                  return callback(err);
                }

                if (users.length !== 1) {
                  shortCourse.createdByEmail = '';
                } else {
                  shortCourse.createdByEmail = users[0].email;
                  userCache[course.createdBy] = users[0].email;
                }
                returnData.push(shortCourse);
                callback();
              });
            });
          }, function(err){
            if (err) {
              return callback(err);
            }
            return res.status(200).json({ success: true, courses: returnData });
          });
        }, id);
      });
    });
  });

  app.contentmanager.addContentHook('create', 'config', { when: 'post' }, function(data, next) {
    app.db.retrieve('extensiontype', { _isAddedByDefault: true }, function(error, results) {
      if(error) {
        return next(error);
      }
      if(!results.length) {
        return next(null, data);
      }
      app.emit('extensions:enable', data._courseId.toString(), _.pluck(results, '_id'), function(error) {
        next(error, data);
      });
    });
  });
}

/**
 * The default for listing the courses that use a specific plugin
 * This should be overridden in each plugin type object
 *
 */
BowerPlugin.prototype.getUses = function (callback, id) {
    return callback(new Error('The getUses function must be overridden in the plugin’s object'));
};

/**
 * the default endpoint for PUT /api/{plugintype}/
 *
 */

BowerPlugin.prototype.updatePluginType = function (req, res, next) {
  var self = this;
  var whitelistedAttrs = [ // only certain attributes are allowed
    '_isAvailableInEditor',
    '_isAddedByDefault'
  ];
  database.getDatabase(function (err, db) {
    if (err) {
      return next(err);
    }
    db.update(self.getPluginType(), { _id: req.params.id }, _.pick(req.body, whitelistedAttrs), function (err) {
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
  var schema = false;
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

      async.waterfall([
        addToDB,
        copyPlugin
      ], function(error, plugin) {
        if (error) return cb(error);
        cb(null, plugin);
      });
    });
  });

  function copyPlugin(pluginDoc, addCb) {
    // @TODO - this should be removed when we move to symlinked plugins :-\
    if (!options.skipTenantCopy) {
      // Copy this version of the component to a holding area (used for publishing).
      // Folder structure: <versions folder>/adapt-contrib-graphic/0.0.2/adapt-contrib-graphic/...
      var destination = path.join(plugin.options.versionsFolder, pkgMeta.name, pkgMeta.version, pkgMeta.name);
      fs.remove(destination, function(err) {
        if (err) {
          // can't continue
          logger.log('error', err);
          return addCb(err);
        }

        fs.mkdirs(destination, function (err) {
          if (err) {
            logger.log('error', err);
            return addCb(err);
          }

          // move from the cache to the versioned dir
          fs.copy(packageInfo.canonicalDir, destination, function (err) {
            if (err) {
              // don't double call callback
              logger.log('error', err);
              return addCb(err);
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
            fs.remove(tenantPluginPath, function (err) {
              if (err) {
                logger.log('error', err);
                return addCb(err);
              }

              fs.copy(packageInfo.canonicalDir, tenantPluginPath, function (err) {
                if (err) {
                  logger.log('error', err);
                  return addCb(err);
                }

                // done
                logger.log('info', 'Successfully copied ' + pkgMeta.name + ' to tenant ' + tenantPluginPath);
                return addCb(null, pluginDoc);
              });
            });
          });
        });
      });
    }
  }

  function addToDB(addCb) {
    // build the package information
    var package = extractPackageInfo(plugin, pkgMeta, schema);
    // add the package to the modelname collection
    database.getDatabase(function (err, db) {
      if (err) {
        logger.log('error', err);
        return addCb(err);
      }

      // don't duplicate component.name, component.version
      db.retrieve(plugin.type, { name: package.name, version: package.version }, function (err, results) {
        if (err) {
          logger.log('error', err);
          return addCb(err);
        }

        if (results && 0 !== results.length) {
          // don't add duplicate
          if (options.strict) {
            return addCb(new PluginPackageError("Can't add plugin: plugin already exists!"));
          }
          return addCb(null);
        }

        db.create(plugin.type, package, function (err, newPlugin) {
          if (err) {
            if (options.strict) {
              return addCb(err);
            }

            logger.log('error', 'Failed to add package: ' + package.name, err);
            return addCb(null);
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
                  return addCb(err);
                }

                plugin.updateLegacyContent(newPlugin, oldPlugin, function (err) {
                  if (err) {
                    logger.log('error', err);
                    return addCb(err);
                  }

                  // Remove older versions of this plugin
                  db.destroy(plugin.type, { name: package.name, version: { $ne: newPlugin.version } }, function (err) {
                    if (err) {
                      logger.log('error', err);
                      return addCb(err);
                    }

                    logger.log('info', 'Successfully removed versions of ' + package.name + '(' + plugin.type + ') older than ' + newPlugin.version);
                    return addCb(null, newPlugin);
                  });
                });
              });
            } else {
              // nothing to do!
              // Remove older versions of this plugin
              db.destroy(plugin.type, { name: package.name, version: { $ne: newPlugin.version } }, function (err) {
                if (err) {
                  logger.log('error', err);
                  return addCb(err);
                }

                logger.log('info', 'Successfully removed versions of ' + package.name + '(' + plugin.type + ') older than ' + newPlugin.version);

                return addCb(null, newPlugin);
              });
            }
          });
        });
      });
    }, options.tenantId);
  }
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
  fs.remove(options.directory, function (err) {
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
                async.eachSeries(Object.keys(packageInfo), function (key, next) {
                  if (!packageInfo[key].pkgMeta.framework) {
                    return addPackage(plugin, packageInfo[key], options, next);
                  }
                  installHelpers.getInstalledFrameworkVersion(function(error, frameworkVersion) {
                    if(error) {
                      return next(error);
                    }
                    // If the plugin defines a framework, ensure that it is compatible
                    if (!semver.satisfies(semver.clean(frameworkVersion), packageInfo[key].pkgMeta.framework, { includePrerelease: true })) {
                      logger.log('warn', 'Unable to install ' + packageInfo[key].pkgMeta.name + ' as it is not supported in the current version of the Adapt framework');
                      return next();
                    }
                    addPackage(plugin, packageInfo[key], options, next);
                  });
                }, cb);
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
  // note we populate options with defaults
  bower.commands.info(packageName, null, _.extend(_.clone(defaultOptions), options))
    .on('end', function(info) {
      // if we get here, we know the package exists...
      var latestPkg = info.latest;
      // see bowermanager.js:117
      var pluginType = latestPkg.hasOwnProperty('component') ? 'component' : latestPkg.hasOwnProperty('extension') ? 'extension' : latestPkg.hasOwnProperty('menu') ? 'menu' : latestPkg.hasOwnProperty('theme') ? 'theme' : '';
      // FIXME got to be a better way to do ln820-834
      app.contentmanager.getContentPlugin(pluginType, function(error, plugin) {
        if(error) {
          logger.log('error', error);
          return cb(error);
        }
        origin().db.retrieve(plugin.getPluginType(), { name: packageName }, {}, function(error, results) {
          if(error) {
            logger.log('error', error);
            return cb(error);
          }
          if(results.length !== 1) {
            logger.log('error', `Unexpected number of ${packageName}s found (${results.length})`);
            return cb(error);
          }
          installHelpers.getInstalledFrameworkVersion(function(error, frameworkVersion) {
            if(error) {
              return cb(error);
            }
            var installedVersion = results[0].version;
            var latestVersionIsNewer = semver.gt(latestPkg.version, installedVersion);
            var satisfiesFrameworkReq = semver.satisfies(semver.clean(frameworkVersion), latestPkg.framework, { includePrerelease: true });

            if(!latestVersionIsNewer) {
              logger.log('info', `Already using the latest version of ${packageName} (${latestPkg.version})`);
              return cb(null, false);
            }
            if(!satisfiesFrameworkReq) {
              // TODO recursively check old versions; we may be several releases behind
              logger.log('warn', `A later version of ${packageName} is available but is not supported by the installed version of the Adapt framework (${frameworkVersion})`);
              return cb(null, false);
            }
            logger.log('info', `A new version of ${packageName} is available (${latestPkg.version})`);
            cb(null, true);
          });
        });
      });
    })
    .on('error', function(err) {
      logger.log('error', err);
      return cb(null, false);
    });
}

/**
 * handles uploaded plugins
 *
 */

function handleUploadedPlugin (req, res, next) {
  var form = new IncomingForm();
  form.maxFileSize = configuration.getConfig('maxFileUploadSize');
  form.parse(req, function (error, fields, files) {
    if(error) {
      if (form.bytesExpected > form.maxFileSize) {
        return res.status(400).json(new PluginPackageError(app.polyglot.t('app.uploadsizeerror', {
          max: bytes.format(form.maxFileSize),
          size: bytes.format(form.bytesExpected)
        })));
      }
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

            installHelpers.getInstalledFrameworkVersion(function(error, frameworkVersion) {
              if(error) {
                return next(error);
              }
              // Check if the framework has been defined on the plugin and that it's not compatible
              if (packageInfo.pkgMeta.framework && !semver.satisfies(semver.clean(frameworkVersion), packageInfo.pkgMeta.framework, { includePrerelease: true })) {
                return next(new PluginPackageError('This plugin is incompatible with version ' + frameworkVersion + ' of the Adapt framework'));
              }
              app.contentmanager.getContentPlugin(pluginType, function (error, contentPlugin) {
                if (error) {
                  return next(error);
                }
                addPackage(contentPlugin.bowerConfig, packageInfo, { strict: true }, function (error, results) {
                  if (error) {
                    return next(error);
                  }

                  function sendResponse() {
                    res.statusCode = 200;
                    return res.json({ 
                      success: true, 
                      pluginType: pluginType, 
                      message: 'successfully added new plugin' 
                    });
                  }

                  Promise.all([
                    fs.remove(file.path),
                    fs.remove(outputPath)
                  ]).then(sendResponse).catch(sendResponse);

                });
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
