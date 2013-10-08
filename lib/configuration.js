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

var fs = require('fs'),
    path = require('path'),
    _ = require('underscore');

/**
 * Returns a new configuration object
 *
 * @return {Object} a Configuration object
 */

function Configuration() {
  this.serverRoot = process.cwd() + '/';
  this.configFile = path.join(this.serverRoot, 'conf', 'config.json');
  this.conf = {}; 
  this.mconf = {};
  this.load(this.configFile);
  return this;
}

/**
 * Loads config from disk
 *
 * @param {String} file - the path to the config file
 * @api public
 */

Configuration.prototype.load = function(filePath) {
  var defaults = {
    'serverPort': 3000
  };

  if (fs.existsSync(filePath)) {
    var file = fs.readFileSync(filePath);
    // allow this to throw an exception if the file cannot be parsed
    var fileConf = JSON.parse(file);
    this.conf = _.extend(this.conf, fileConf);
  }
}

/**
 * Sets a global configuration value
 *
 * @param {String} name - the configuration to set
 * @param {String} value - the value to set it to
 * @api public
 */

Configuration.prototype.setConfig = function(name, value) {
  if (name && typeof name === 'string') {
    this.conf[name] = value;
  }
}

/**
 * Gets a global configuration value
 *
 * @param {String} name - the configuration to get
 * @return {value} - the value of the config if set, or an empty string
 * @api public
 */

Configuration.prototype.getConfig = function(name) {;
  if (name && typeof name === 'string' && this.conf[name]) {
    return this.conf[name];
  }

  return '';
}

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
}

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
}

/**
 * Creates a new configuration object
 * 
 */

function createConfiguration() {
  return new Configuration();
}

/**
 * Module exports
 */

exports = module.exports = createConfiguration();

