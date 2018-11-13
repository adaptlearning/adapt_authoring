// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Simple key value store for configuration items. Loads initial config from disk
 * and then extends with settings saved in database
 *
 * @TODO - calipso wraps up {@link https://github.com/flatiron/nconf|nconf}. Perhaps we should consider doing the same?
 *
 * @module configuration
 */

/**
 * Module depencies
 */

const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const logger = require('./logger');
const bytes = require('bytes');

/*
 * CONSTANTS
 */
var MODNAME = 'configuration';
var ALLOWED_CLIENT_SIDE_KEYS = [
  'rootUrl',
  'outputPlugin',
  'masterTenantID',
  'recaptchaSiteKey',
  'useSmtp',
  'useffmpeg',
  'isProduction',
  'maxLoginAttempts',
  'ckEditorExtraAllowedContent',
  'ckEditorEnterMode',
  'maxFileUploadSize'
];

/**
 * Errors
 */

function MissingConfigError (filePath, message) {
  this.name = 'MissingConfigError';
  this.message = (message || 'Configuration file not found') + ": " + filePath;
  this.filePath = filePath;
}

util.inherits(MissingConfigError, Error);

function absorbConfigFile (config, filePath, callback) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      logger.log('error', 'Could Not Read Config File :: ' + filePath, err.toString());
      return callback(err);
    } else {
      try {
        config.conf = _.extend(config.conf, JSON.parse(data));
      } catch (e){
        logger.log('error', 'Invalid Configuration JSON :: ' + filePath + '\n' + e.toString());
        return callback(e);
      }
      return callback();
    }
  });
}

/**
 * Returns a new configuration object
 *
 * @return {Object} a Configuration object
 */
function Configuration() {
  this.serverRoot = path.normalize(path.join(__dirname, '..'));
  this.tempDir = path.join(this.serverRoot, 'temp');
  this.configFile = '';
  // default settings (overriden by the config json)
  this.conf = {
    root: this.serverRoot,
    maxLoginAttempts: 3,
    ckEditorExtraAllowedContent: 'span(*)',
    maxFileUploadSize: '200MB',
    ckEditorEnterMode: 'ENTER_P'
  };
  this.mconf = {};
  return this;
}

util.inherits(Configuration, EventEmitter);

/**
 * Loads config from disk
 *
 * @param {string} filePath - the path to the config file
 * @param {callback} callback
 * @api public
 */
Configuration.prototype.load = function (filePath, callback) {
  var config = this;

  // first, attempt to load config from environment
  if (process.env.serverPort) {
    config.conf = _.extend(config.conf, process.env);
    config.emit('change:config', 'configuration');
    logger.log('info', 'configuration loaded from process.env');
    return callback();
  }

  // else, load from the default config file
  fs.exists(filePath, function(exists){
    if (exists) {
      if (config.configFile !== filePath) { // @TODO - notify that config file needs updated
        config.configFile = filePath;
      }

      absorbConfigFile(config, filePath, function (error) {
        if (error) {
          return callback(error)
        }

        config.emit('change:config', 'configuration');
        logger.log('info', 'configuration loaded from ' + filePath);
        return callback();
      });
    } else {
      return callback(new MissingConfigError(filePath));
    }
  });
};


/**
 * Sets a global configuration value
 *
 * @param {String} name - the configuration to set
 * @param {String} value - the value to set it to
 * @api public
 */
Configuration.prototype.setConfig = function (name, value) {
  if (name && typeof name === 'string') {
    this.conf[name] = value;
  }
};

/**
 * Gets a global configuration value
 *
 * @param {String} [name] - the configuration to get, or nothing to get the entire config object
 * @return {value} - the value of the config if set, or an empty string
 * @api public
 */
Configuration.prototype.getConfig = function (name) {
  if (name === 'maxFileUploadSize') {
    return bytes.parse(this.conf.maxFileUploadSize);
  }

  if (name && typeof name === 'string') {
    switch(this.conf[name]) {
      case 'y': case 'Y':
        return true;
      case 'n': case 'N':
        return false;
    }
    return this.conf[name] || '';
  }

  if (typeof name === 'undefined') {
    return this.conf;
  }

  return '';
};

/**
 * Gets any client-side configurations which should returned client-side
 *
 * @return {value} - object with allowed configuration key-values | null
 * @api public
 */
Configuration.prototype.getAllClientSideConfigs = function() {
  var configs = this.getConfig();
  if (!configs) return null;

  // Only return allowed values
  return ALLOWED_CLIENT_SIDE_KEYS.reduce((result, key) => {
    if (!configs.hasOwnProperty(key)) return result;
    result[key] = this.getConfig(key);
    return result;
  }, {
    humanMaxFileUploadSize: configs['maxFileUploadSize']
  });
};

/**
 * Sets a configuration value for a module
 *
 * @param {String} module - the configuration to set
 * @param {String} name - the configuration to set
 * @param {value} value - the value to set it to
 * @api public
 */
Configuration.prototype.setModuleConfig = function(module, name, value) {
  if (module && typeof module === 'string') {
    if (!this.mconf[module] || typeof this.mconf[module] !== 'object') {
      this.mconf[module] = {};
    }

    if (name && typeof name === 'string') {
      this.mconf[module][name] = value;
    }
  }
};

/**
 * Gets a configuration value for a module
 *
 * @param {String} module - the module to get configuration for
 * @param {String|null} name - the name of the config value to get (optional)
 * @return {String|Object} - if name is omitted, an object with all config
 *  values for the object is returned, otherwise, just the named config value
 *
 * @api public
 */
Configuration.prototype.getModuleConfig = function (module, name) {
  if (module && typeof module === 'string' && this.mconf[module]) {
    if(!name || typeof name !== 'string') {
      return _.clone(this.mconf[module]);
    }

    if (this.mconf[module][name]) {
      return this.mconf[module][name];
    }

    return '';
  }

  return '';
};

/**
 * preload function
 *
 * @param {object} app - the Origin instance
 * @return {object} preloader - a ModulePreloader
 */
Configuration.prototype.preload = function (app) {
  var preloader = new app.ModulePreloader(app, MODNAME, {events:{preload:preloadHandle(app,this)}});
  return preloader;
};

/**
 * Creates a new configuration object
 *
 */
function createConfiguration() {
  return new Configuration();
}

/**
 * Returns a function to handle the preload event from app when it is called at startup
 *
 * @param {object} app Reference to the App
 * @param {object} instance Reference to the Configuration instance
 */
function preloadHandle(app, instance){
  return function(){
    var preloader = this;
    preloader.emit('preloadChange', MODNAME, app.preloadConstants.LOADING);

    // set app.configuration attribute when the configuration loads
    instance.on('change:config', function (e) {
      app.configuration = instance;
    });

    // load configuration file from default path
    instance.load(path.join(instance.serverRoot, app.options.configFile), function (err) {
      if (err) {
        // if error is that the config file is missing, it just means we need to run an install,
        // so we can recover, otherwise we need to fail
        if (!(err instanceof MissingConfigError)) {
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.FAILED, err);
          return false;
        }
      }

      preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
      return true;
    });
  }
}

/**
 * Module exports
 */
exports = module.exports = createConfiguration();
