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
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

/*
 * CONSTANTS
 */
var MODNAME = 'configuration'

/**
 * Returns a new configuration object
 *
 * @return {Object} a Configuration object
 */
function Configuration() {
  this.serverRoot = process.cwd();
  this.configFile = '';
  this.conf = {root:this.serverRoot};
  this.mconf = {};
  return this;
}

util.inherits(Configuration, EventEmitter);

/**
 * Loads config from disk
 *
 * @param {String} file - the path to the config file
 * @api public
 */
Configuration.prototype.load = function(filePath,callback) {
  var defaults = {
    'serverPort': 3000
  };
  
  if(!callback){
    callback = function(){
      //Empty callback
    };
  }

  fs.exists(filePath, function(exists){
    if(exists){
      if (this.configFile !== filePath) { // @TODO - notify that config file needs updated
        this.configFile = filePath;
      }
      
      fs.readFile(filePath,function(err,data){
        if(err){
          console.log('Could Not Read Config File :: ' + filePath + '\n' + err.toString());
        }else{
          try{
            this.conf = _.extend(this.conf,JSON.parse(data));
          }catch(e){
            console.log('Invalid Configuration JSON :: ' + filePath + '\n' + e.toString());
            err = e;
          }
        }
        this.emit('moduleReady', 'configuration');
        callback(err);
      }.bind(this));
    }else{
      console.log('No Configuration File Found At :: ' + filePath);
    }
  }.bind(this));
};

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
};

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
 * @param {object} app - the AdaptBuilder instance
 * @return {object} preloader - an AdaptBuilder ModulePreloader
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
    instance.load(path.join(instance.serverRoot, app.options.configFile),function(err){
      if(!err){
        app.configuration = instance;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        return true;
      }
      
      preloader.emit('preloadChange', MODNAME, app.preloadConstants.FAILED,err);
    });
  }
}

/**
 * Module exports
 */
exports = module.exports = createConfiguration();

