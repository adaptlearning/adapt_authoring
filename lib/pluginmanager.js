/**
 * Module dependencies
 */

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    configuration = require('./configuration'),
    database = require('./database'),
    logger = require('./logger'),
    EventEmitter = require('events').EventEmitter;

var pluginStates = {
  NOT_INSTALLED       : 'not_installed',
  HIGHER_VERSION      : 'higher_version',
  LOWER_VERSION       : 'lower_version',
  MISSING_FROM_DISK   : 'missing_from_disk',
  MISSING_DEPENDENCIES: 'missing_dependencies',
  OK                  : 'ok'
};

/**
 *
 * @constructor
 */

function PluginManager() {
  this.pluginDir = 'plugins';
  this.numPluginsOnDisk = 0;
}

util.inherits(PluginManager, EventEmitter);

/**
 * Gets the list of plugin types supported by the builder
 *
 * return {array} list of plugin types
 */

PluginManager.prototype.getPluginTypes = function () {
  return [
    'filestorage',
    'output'
  ];
};

/**
 * Fetches a list of plugins that have been installed asynchronously.
 *
 * @param {function} callback - function of the form function (error, plugins)
 */

PluginManager.prototype.getInstalledPlugins = function (callback) {
  var db = database.getDatabase();
  db.retrieve('Plugin', null, function (error, results) {
    if (error || !results) {
      logger.log('error', 'Failed to retrieve Plugin records with error', error);
      callback(error);
    } else {
      var plugins = Object.create(null);
      var plugin;
      for (var res = 0; res < results.length; ++res) {
        plugin = results[res];
        if (!plugin[plugin.type] || 'object' !== typeof plugins[plugin.type]) {
          plugins[plugin.type] = Object.create(null);
        }
        plugins[plugin.type][plugin.name] = plugin;
      }
      callback(null, plugins);
    }
  });
};

/**
 * Gets information on available plugins organised by type - synchronous for simplicity
 * NB: this returns all plugins available on disk, not just installed plugins, and is
 * intended to be used only during super admin procedures
 *
 * @return {object} all available plugins grouped by type
 */

PluginManager.prototype.getPlugins = function () {
  if (!this.plugins) {
    this.plugins = Object.create(null);
    var pluginDirs = [];
    var that = this;
    var pluginInfoFactory = new PluginInfoFactory();
    var pluginTypes = this.getPluginTypes();
    var pluginType = '';
    for (var type = 0; type < pluginTypes.length; ++type) {
      pluginType = pluginTypes[type];

      // add plugintype property to plugins
      if (!this.plugins[pluginType] || typeof this.plugins[pluginType] !== 'object') {
        this.plugins[pluginType] = Object.create(null);
      }

      // assume that everything in the plugintype directory is a directory - the factory build will tell us otherwise
      pluginDirs = buildPluginPaths(pluginType, this.pluginDir);
      if (pluginDirs.length) {
        for (var dir = 0; dir < pluginDirs.length; ++dir) {
          var pluginDir = pluginDirs[dir];
          try {
            var pluginInfo = pluginInfoFactory.build(pluginDir);
            this.plugins[pluginType][pluginInfo.name] = pluginInfo;
            // remember the number of plugins on disk for convenience
            ++this.numPluginsOnDisk;
          } catch (error) {
            logger.log('error', 'Failed to load plugin at path ' + pluginDir, error);
          }
        }
      }
    }
  }

  return this.plugins;
};

/**
 * Returns a specific plugin or list of plugins of a specified type
 *
 * @param {string} type - the plugin type
 * @param {string} [pluginName] - the name of a specific plugin to get
 */

PluginManager.prototype.getPlugin = function (type, pluginName, callback) {
  if (!type || 'string' !== typeof type) {
    logger.log('warning', 'PluginManager#getPlugin requires type parameter');
    callback(new Error("PluginManager#getPlugin requires type parameter"));
  }

  var pluginTypes = this.getPluginTypes();
  if (-1 === pluginTypes.indexOf(type)) {
    logger.log('warning', type + ' is not a recognized plugin type');
    callback(new Error("Plugin type was not found: " + type));
  }

  // make sure we have retrieved available plugins
  if (!this.plugins) {
    this.getPlugins(); // no need to assign return val
  }

  if (this.plugins[type]) {
    if (pluginName && 'string' === typeof pluginName) {
      if (!this.plugins[type][pluginName]) {
        callback(new Error('Plugin of type ' + type + ' and name ' + pluginName + ' was not found!'));
      } else {
        callback(null, this.plugins[type][pluginName]);
      }
    } else {
      // type was specified but pluginName was not, so we return all plugins of the specified type
      callback(null, this.plugins[type]);
    }
  } else {
    // plugin was not found
    callback(new Error('Plugin was not found: ' + type + '/' + pluginName));
  }
};

/**
 * Checks if we need to upgrade:
 *  - if new plugin on disk is detected
 *  - if version of plugin on disk is different from that in database
 *
 * @param {function} callback - receives boolean: true if plugins need installed/updated, otherwise false
 */

PluginManager.prototype.isUpgradeRequired = function (callback) {
  var diskPlugins = this.plugins;
  // if we have not fetched plugins from disk, do it
  if (!diskPlugins) {
    diskPlugins = this.getPlugins();
  }

  var numPluginsOnDisk = this.numPluginsOnDisk;
  // early return if there are no plugins on disk
  if (!numPluginsOnDisk) {
    callback(false);
  } else {
    // get plugins from db
    var pluginTypes = this.getPluginTypes();
    var diskPlugins = this.plugins;
    var db = database.getDatabase();
    db.retrieve('Plugin', {}, function (error, results) {
      if (error) {
        logger.log('error', 'Failed to discover plugins in database!', error);
        callback(false);
      } else if (results.length) {
        var installed = Object.create(null);
        for (var res = 0; res < results.length; ++res) {
          var plugin = results[res];
          if (!installed[plugin.type] || 'object' !== typeof installed[plugin.type]) {
            installed[plugin.type] = Object.create(null);
          }
          installed[plugin.type][plugin.name] = plugin;
        }

        // iterate disk plugins and find any missing from installed
        // Note: objects created with Object.create(null) don't need to use hasOwnProperty
        for (var type in diskPlugins) {
          for (var pluginName in diskPlugins[type]) {
            if (!installed[type] || !installed[type][pluginName]) {
              callback(true);
            }

            var diskVersion = diskPlugins[type][pluginName].version.split('.');
            var dbVersion = installed[type][pluginName].version.split('.');
            if (diskVersion.length != 3 ||
                diskVersion.length != dbVersion.length ||
                diskVersion[0] > dbVersion[0] ||
                diskVersion[1] > dbVersion[1] ||
                diskVersion[2] > dbVersion[2]) {
              callback(true);
            }
          }
        }

        // if we got this far, we're all up to date
        callback(false);
      } else if (numPluginsOnDisk) {
        // plugins on disk, none in db
        callback(true);
      } else {
        // no plugins in db or disk
        callback(false);
      }
    });
  }
};

/**
 * Adds a pluginInfo record to the database
 *
 * @TODO - need to call upgrade/install hooks for plugins
 *
 * @param {PluginInfo} pluginInfo - the details of a plugin to be installed
 * @param {function} callback - function of the form function(error)
 */

PluginManager.prototype.installPlugin = function (pluginInfo, callback) {
  var db = database.getDatabase();
  db.create('Plugin', pluginInfo, function (error, result) {
    if (error) {
      logger.log('error', 'failed to install plugin!', error);
      callback(error);
    } else {
      callback(null);
    }
  });
};

/**
 * Removes a pluginInfo record from the database
 *
 * @TODO - need to call uninstall hooks for plugins
 *
 * @param {PluginInfo} pluginInfo - the details of a plugin to be installed
 * @param {function} callback - function of the form function(error)
 */

PluginManager.prototype.uninstallPlugin = function (pluginInfo, callback) {
  var db = database.getDatabase();
  db.destroy('Plugin', { name: pluginInfo.name, type: pluginInfo.type }, function (error) {
    if (error) {
      logger.log('error', 'failed to uninstall plugin!', error);
      callback(error);
    } else {
      callback(null);
    }
  });
};
/**
 * Checks if a plugin is installed asynchronously for convenience.
 * NB: Does not check plugin version or do validation
 *
 * @param {PluginInfo} pluginInfo - a pluginInfo object
 * @param {function} callback - function of the form function(installed)
 */

PluginManager.prototype.isInstalled = function (pluginInfo, callback) {
  var db = database.getDatabase();
  db.retrieve('Plugin', { type: pluginInfo.type, name: pluginInfo.name}, function (error, results) {
    if (error) {
      logger.log(error, 'error retrieving Plugin record', error);
      callback(false);
    } else if (results && results.length && results.length === 1) {
      callback(true);
    } else {
      callback(false);
    }
  });
};

/**
 * Tests for a given state asynchronously
 * @TODO test for remaining states
 *
 * @api public
 * @param {PluginInfo} pluginInfo - details of the plugin to check
 * @param {string} state - one of pluginStates constants
 * @param {function} callback - receives a parameter 'state' representing the state of the plugin
 */

PluginManager.prototype.testPluginState = function (pluginInfo, state, callback) {
  switch (state) {
    case pluginStates.MISSING_FROM_DISK : {
      // all we do now is check the state of the plugin on disk
      fs.exists(pluginInfo.fullPath, function (exists) {
        if (exists) {
          callback(pluginStates.OK);
        } else {
          callback(pluginStates.MISSING_FROM_DISK);
        }
      });
      break;
    }
    default:
      callback(pluginStates.OK);
      break;
  }
};

/**
 * checks whether a given list of dependencies are installed
 *
 * @api public
 * @param {array} dependencies - list of plugins to check for
 * @return {boolean} - true if all dependencies are installed, otherwise false
 */

PluginManager.prototype.dependenciesInstalled = function (dependecies) {
  // @TODO implement
  return true;
};

/**
 * Provides a function 'build' that creates an instance of pluginInfo by inspecting files in
 * plugin directory
 *
 */

function PluginInfoFactory () {
  return {
    build: function (pluginPath) {
      if ('string' !== typeof pluginPath) {
        throw new Error('param pluginPath must be a string!');
      }

      var pluginInfo = new PluginInfo();

      // produces something like ['pluginsdir', 'plugintype', 'pluginname']
      var components = pluginPath.split(path.sep);
      if (components.length !== 3) {
        throw new Error('Invalid plugin path: ' + pluginPath);
      } else {
        pluginInfo.type = components[1];
        pluginInfo.name = components[2];
        pluginInfo.type_name = pluginInfo.type + "_" + pluginInfo.name;
        pluginInfo.fullPath = path.join(configuration.serverRoot, pluginPath);

        // allow this to throw
        var packageData = loadPackageFile(pluginInfo);
        pluginInfo.init(packageData);
      }

      return pluginInfo;
    }
  };
}

/**
 * Contains meta data on a plugin. Use {@link PluginInfoFactory} to build
 *
 * @constructor
 */

function PluginInfo() {
  this.type = '';                   // group name for this plugin type, e.g. FileStorage
  this.name = '';                   // name of this plugin e.g. localfs
  this.type_name = '';              // unique identifier - there cannot be two plugins of the same type with the same name
  this.displayName = '';            // name of this plugin as displayed on interface e.g Local File Storage
  this.fullPath = '';               // path to the directory for this plugin e.g plugins/filestorage/localfs
  this.diskVersion = '';            // version in the plugin's metadata
  this.dbVersion = '';              // version in the instance database
  this.requiredBuilderVersion = ''; // required version of Adapt-Builder-Core
  this.dependencies = [];           // other plugins that are expected to be installed
}

/**
 * initialises remaining properties in the object from data on disk
 *
 * @param {object} data - data specified in the plugin's package.json file
 */

PluginInfo.prototype.init = function (data) {
  this.version = data.version;
  this.diskVersion = data.version;
  this.requiredBuilderVersion = data.requires;
  this.dependencies = data.dependencies || this.dependencies;
  this.displayName = data.displayName;
};

/**
 * Loads a package file from a pluginInfo's directory and calls the pluginInfo's init method
 *
 * @throws an error if the package file is not found
 *
 * @api private
 * @param {PluginInfo} pluginInfo - a pluginInfo object
 * @return {object} the data loaded from the package file
 */

function loadPackageFile (pluginInfo) {
  if (!pluginInfo.fullPath || 'string' !== typeof pluginInfo.fullPath) {
    throw new Error('Attempted to load version information but fullpath is not set!');
  }

  var data = false;
  var packageFile = path.join(pluginInfo.fullPath, 'package.json');
  if(fs.existsSync(packageFile)) {
    // allow the following to throw
    data = fs.readFileSync(packageFile);
    data = JSON.parse(data);
  } else {
    throw new Error('Package file does not exist: ' + packageFile);
  }

  return data;
};

/**
 * Helper function to build a list of plugin directories under the specified type
 *
 * @param {string} type - the type of plugin to search for (e.g. output, filestorage)
 * @param {string} baseDir - the name of the plugin directory from the root of the app
 *
 * @return {array} a list of directories if found
 */

function buildPluginPaths(type, baseDir) {
  var dirs = []; // will store path to all plugins of type {type}
  var typePath = path.join(configuration.serverRoot, baseDir, type);
  if(fs.existsSync(typePath)) {
    // we only get the directory name, so we need to prepend the base path and type
    dirs = fs.readdirSync(typePath);
    for (var i = 0; i < dirs.length; ++i) {
      dirs[i] = path.join(baseDir, type, dirs[i]);
    }
  }

  return dirs;
}

/**
 * Singleton access point. Creates a new PluginManager if it doesn't exist
 *
 * @return {PluginManager} a PluginManager instance
 */

function getManager() {
  if (!this.manager || !this.manager instanceof PluginManager) {
    this.manager = new PluginManager();
  }

  return this.manager;
}

/**
 * Module exports
 */

exports.states = pluginStates;
exports.getManager = getManager;
exports.PluginManager = PluginManager;
exports.PluginInfo = PluginInfo;
module.exports = exports;
