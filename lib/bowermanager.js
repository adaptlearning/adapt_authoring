var _ = require('underscore');
var async = require('async');
var bower = require('bower');
var fs = require('fs-extra');
var path = require('path');
var semver = require('semver');

var installHelpers = require('./installHelpers');
var Constants = require('./outputmanager').Constants;
var database = require('./database');
var logger = require('./logger');
var origin = require('./application')();

var bowerOptions = require('../plugins/content/bower/defaults.json');

/*
 * CONSTANTS
 */
var MODNAME = 'bowermanager',
    WAITFOR = 'contentmanager';

var BowerManager = function() {

}

BowerManager.prototype.extractPackageInfo = function(plugin, pkgMeta, schema) {
  // Build package info.
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

  // The targetAttribute property is optional.
  if (pkgMeta.targetAttribute) {
    info.targetAttribute = pkgMeta.targetAttribute;
  }

  // The assetFields property is optional too.
  if (pkgMeta.assetFields) {
    info.assetFields = pkgMeta.assetFields;
  }

  // Set the type and package id for the package.
  info[plugin.getModelName()] = pkgMeta[plugin.getModelName()];

  // Set extra properties.
  plugin.extra && plugin.extra.forEach(function (key) {
    if (pkgMeta[key]) {
      info[key] = pkgMeta[key];
    }
  });

  return info;
}

/**
 * Installs a specified Adapt plugin.
 * @param {string} pluginName - The name of the Adapt plugin
 * @param {string} pluginVersion - The semantic version or branch name to install, for latest use '*'
 * @param {function} callback - Callback function
 */
BowerManager.prototype.installPlugin = function(pluginName, pluginVersion, callback) {
  var self = this;
  // Formulate the package name.
  var packageName = (pluginVersion == '*')
    ? pluginName
    : pluginName + '#' + pluginVersion;

    // Clear the bower cache for this plugin.
    fs.remove(path.join(bowerOptions.directory, pluginName), function (err) {
      if (err) {
        logger.log('error', err);
        return callback(err);
      }

      // Query bower to verify that the specified plugin exists.
      bower.commands.search(pluginName, bowerOptions)
        .on('error', callback)
        .on('end', function (results) {
          if (!results || results.length == 0) {
            logger.log('warn', 'Plugin ' + packageName + ' not found!');
            return callback('Plugin ' + packageName + ' not found!');
          }

        // The plugin exists -- remove any fuzzy matches, e.g. adapt-contrib-assessment would
        // also bring in adapt-contrib-assessmentResults, etc.
        var bowerPackage = _.findWhere(results, { name: pluginName });

        // Install the plugin from bower.
        bower.commands.install([packageName], { save: true }, bowerOptions)
          .on('error', function(err) {
            logger.log('error', err);
            return callback(err);
          })
          .on('end', function (packageInfo) {
            // Unfortunately this is required as the only way to identify the type
            // of a plugin is to check for the presence of the property which
            // actually indicates its type. :-/
            var pluginType = packageInfo[pluginName].pkgMeta.hasOwnProperty('component')
              ? 'component'
              : packageInfo[pluginName].pkgMeta.hasOwnProperty('extension')
                ? 'extension'
                : packageInfo[pluginName].pkgMeta.hasOwnProperty('menu')
                  ? 'menu'
                  : packageInfo[pluginName].pkgMeta.hasOwnProperty('theme')
                    ? 'theme' : ''

            if (pluginType == '') {
              logger.log('error', 'Unable to identify pluginType for ' + packageName);
              return callback('Unable to identify pluginType for ' + packageName);
            }

            app.contentmanager.getContentPlugin(pluginType, function(err, plugin) {
              if (err) {
                return callback(err);
              }
              installHelpers.getInstalledFrameworkVersion(function(error, frameworkVersion) {
                if (error) {
                  return callback(error);
                }
                if (!packageInfo[pluginName].pkgMeta.framework) {
                  return self.importPackage(plugin, packageInfo[pluginName], bowerOptions, callback);
                }
                // If the plugin defines a framework, ensure that it is compatible
                if (!semver.satisfies(semver.clean(frameworkVersion), packageInfo[pluginName].pkgMeta.framework)) {
                  var error = `Unable to install ${packageInfo[pluginName].pkgMeta.name} (${packageInfo[pluginName].framework}) as it is not supported in the current version of the Adapt framework (${frameworkVersion})`;
                  logger.log('error', error);
                  return callback(error);
                }
                self.importPackage(plugin, packageInfo[pluginName], bowerOptions, callback);
              });
            });
          });
      });
    });
}

/**
* Wrapper for installPlugin which install the latest version that's compatible
* with the installed framework.
* @param {string} pluginName - The name of the Adapt plugin
* @param {function} callback - Callback function
 */
BowerManager.prototype.installLatestCompatibleVersion = function (pluginName, callback) {
  var self = this;
  // Query bower to verify that the specified plugin exists.
  bower.commands.search(pluginName, bowerOptions)
    .on('error', callback)
    .on('end', function (results) {
      if (!results || results.length == 0) {
        logger.log('warn', 'Plugin ' + packageName + ' not found!');
        return callback('Plugin ' + packageName + ' not found!');
      }
      // The plugin exists -- remove any fuzzy matches, e.g. adapt-contrib-assessment would
      // also bring in adapt-contrib-assessmentResults, etc.
      var bowerPackage = _.findWhere(results, {name: pluginName});
      bower.commands.info(bowerPackage.url)
        .on('error', callback)
        .on('end', function (latestInfo) {
          // the versions will be in version order, rather than release date,
          // so no need for ordering
          installHelpers.getInstalledFrameworkVersion(function(error, installedFrameworkVersion) {
            if(error) {
              return callback(error);
            }
            var requiredFrameworkVersion;
            var index = -1;
            async.doUntil(function iterator(cb) {
              bower.commands.info(bowerPackage.url + '#' + latestInfo.versions[++index])
                .on('error', cb)
                .on('end', function (result) {
                  requiredFrameworkVersion = result.framework;
                  cb();
                });
            }, async function isCompatible() {
              return semver.satisfies(installedFrameworkVersion, requiredFrameworkVersion);
            }, function(error, version) {
              if(error) {
                return callback(error);
              }
              self.installPlugin(pluginName, latestInfo.versions[index], callback);
            });
          });
        });
    });
}

/**
 * adds a new package to the system - fired after bower
 * has installed to the cache
 *
 * @param {object} plugin - bowerConfig object for a bower plugin type
 * @param {object} packageInfo - the bower package info retrieved during install
 * @param {object} options
 * @param {callback} callback
 */
BowerManager.prototype.importPackage = function (plugin, packageInfo, options, callback) {
  // Shuffle params.
  if ('function' === typeof options) {
    callback = options;
    options = {
      strict: false
    };
  }

  var self = this;
  var pkgMeta = packageInfo.pkgMeta;
  var schemaPath = path.join(packageInfo.canonicalDir, options._adaptSchemaFile);

  fs.exists(schemaPath, function (exists) {
    if (!exists) {
      if (options.strict) {
        return callback('Package does not contain a schema');
      }

      logger.log('warn', 'ignoring package with no schema: ' + pkgMeta.name);
      return callback(null);
    }

    fs.readFile(schemaPath, function (err, data) {
      var schema = false;
      if (err) {
        if (options.strict) {
          return callback('Failed to parse schema for package ' + pkgMeta.name);
        }

        logger.log('error', 'failed to parse schema for ' + pkgMeta.name, err);
        return callback(null);
      }

      try {
        schema = JSON.parse(data);
      } catch (e) {
        if (options.strict) {
          return callback('Failed to parse schema for package ' + pkgMeta.name);
        }

        logger.log('error', 'failed to parse schema for ' + pkgMeta.name, e);
        return callback(null);
      }

      // use the passed dest, or build a path to the destination working folder
      var destination = path.join(app.configuration.getConfig('root').toString(), 'temp', app.configuration.getConfig('masterTenantID'), 'adapt_framework', 'src', plugin.bowerConfig.srcLocation, pkgMeta.name);

      // Remove whatever version of the plugin is there already.
      fs.remove(destination, function(err) {
        if (err) {
          return logger.log('error', err);
        }

        // Re-create the plugin folder.
        fs.mkdirs(destination, function (err) {
          if (err) {
            return logger.log('error', err);
          }

          // Move from the bower cache to the working directory.
          fs.copy(packageInfo.canonicalDir, destination, function (err) {
            if (err) {
              // Don't double call callback.
              return logger.log('error', err);
            }

            logger.log('info', 'Successfully copied ' + pkgMeta.name + ' to ' + destination);

            // Build the package information.
            var package = self.extractPackageInfo(plugin, pkgMeta, schema);
            var db = app.db;
            var pluginString = package.name + ' (v' + package.version + ')';

            // Add the package to the collection.
            // Check if a plugin with this name and version already exists.
            db.retrieve(plugin.getPluginType(), { name: package.name, version: package.version }, function (err, results) {
              if (err) {
                logger.log('error', err);
                return callback(err);
              }

              if (results && results.length !== 0) {
                // Don't add a duplicate.
                if (options.strict) {
                  return callback("Can't add " + pluginString + ": verion already exists");
                }

                return callback(null);
              }

              // Add the new plugin.
              db.create(plugin.getPluginType(), package, function (err, newPlugin) {
                if (err) {
                  logger.log('error', err);

                  if (options.strict) {
                    return callback(err);
                  }

                  logger.log('error', 'Failed to add package: ' + pluginString, err);
                  return callback(null);
                }

                logger.log('info', 'Added package: ' + pluginString);

                // Retrieve any older versions of the plugin.
                db.retrieve(plugin.getPluginType(), { name: package.name, version: { $ne: newPlugin.version } }, function (err, results) {
                  if (err) {
                    // strictness doesn't matter at this point
                    logger.log('error', 'Failed to retrieve previous packages: ' + err.message, err);
                  }

                  // Remove older versions of this plugin.
                  db.destroy(plugin.getPluginType(), { name: package.name, version: { $ne: newPlugin.version } }, function (err) {
                    if (err) {
                      logger.log('error', err);
                      return callback(err);
                    }

                    logger.log('info', 'Successfully removed versions of ' + package.name + ' (' + plugin.getPluginType() + ') older than ' + newPlugin.version);

                    return callback(null, newPlugin);
                  }); // Remove older versions of the plugin.
                }); // Retrieve older versions of the plugin.
              }); // Add the new plugin.
            }); // Check if a plugin with this name and version already exists.
          });
        });
      });
    });
  });
}

exports = module.exports = {

  // expose the bower manager constructor
  BowerManager : BowerManager,

  /**
   * preload function
   *
   * @param {object} app - the Origin instance
   * @return {object} preloader - a ModulePreloader
   */
  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events: this.preloadHandle(app, new BowerManager()) });
    return preloader;
  },

  /**
   * Event handler for preload events
   *
   * @param {object} app - Server instance
   * @param {object} instance - Instance of this module
   * @return {object} hash map of events and handlers
   */
  preloadHandle : function (app, instance){

    return {
        preload : function(){
          var preloader = this;
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
        },

        moduleLoaded : function(modloaded){
          var preloader = this;

           //is the module that loaded this modules requirement
          if (modloaded === WAITFOR) {
            app.bowermanager = instance;
            preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
          }
        }
      };
  }
};
