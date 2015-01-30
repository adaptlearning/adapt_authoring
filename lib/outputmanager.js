/**
 * Ouput plugin submodule
 */

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    configuration = require('./configuration'),
    logger = require('./logger'),
    rest = require('./rest'),
    pluginmanager = require('./pluginmanager'),
    database = require('./database'),
    usermanager = require('./usermanager'),
    origin = require('../');

/*
 * CONSTANTS
 */
var MODNAME = 'outputmanager',
    WAITFOR = 'pluginmanager';


/**
 * base constructor for Output plugins
 * @api public
 */
function OutputPlugin () {
}

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
OutputPlugin.prototype.preview = function (courseId, req, res, next) {
  logger.log('error', 'OutputPlugin#preview must be implemented by extending objects!');
  throw new Error('OutputPlugin#preview must be implemented by extending objects!');
};

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
OutputPlugin.prototype.publish = function (courseId, req, res, next) {
  logger.log('error', 'OutputPlugin#publish must be implemented by extending objects!');
  throw new Error('OutputPlugin#import must be implemented by extending objects!');
};

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
OutputPlugin.prototype.importCourse = function (req, res, next) {
  logger.log('error', 'OutputPlugin#importCourse must be implemented by extending objects!');
  throw new Error('OutputPlugin#importCourse must be implemented by extending objects!');
};

/**
 * OutputManager class
 */

function OutputManager () {
  this._outputTypes = Object.create(null);
}

// OutputManager is an eventemitter
util.inherits(OutputManager, EventEmitter);

/**
 * gets an output plugin instance
 *
 * @param {string} type - the type(name) of the output plugin
 * @param {callback} cb
 */

OutputManager.prototype.getOutputPlugin = function (type, cb) {
  var self = this;
  if (self._outputTypes[type]) {
    return cb(null, self._outputTypes[type]);
  }

  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('output', type, function (error, pluginInfo) {
    if (error) {
      return cb(new Error('output type plugin ' + type + ' was not found'));
    }

    try {
      var OutputPlugin = require(pluginInfo.fullPath);
      self._outputTypes[type] = new OutputPlugin(); // not sure we need to memoize
      cb(null, self._outputTypes[type]);
    } catch (err) {
      return cb(err);
    }
  });
};

/**
 * sets up rest service routes
 */
OutputManager.prototype.setupRoutes = function () {
  var that = this;

  // Publish for preview
  rest.get('/output/:type/preview/:courseid', function (req, res, next) {
    var type = req.params.type;
    var courseId = req.params.courseid;
    var user = usermanager.getCurrentUser();
    var preview = true;

    that.publish(type, courseId, preview, req, res, function (error, result) {
      if (error) {
        next(error);
      }
      // Redirect to preview
      res.redirect('/preview/' + user.tenant._id + '/' + courseId + '/main.html');
    });
  });

  rest.get('/output/:type/publish/:courseid', function (req, res, next) {
    logger.log('info', 'About to publish');
    var type = req.params.type;
    var courseId = req.params.courseid;
    var preview = false;
    that.publish(type, courseId, preview, req, res, function (error, result) {
      
      if (error) {
        logger.log('error', 'Unable to publish');
        return res.json({ success: false, message: error.message });
      }

      return res.end();
    });
  });

  rest.get('/output/:type/import', function (req, res, next) {
    var type = req.params.type;
    that.importCourse(type, req, res, function (error, result) {
      if (error) {
        return res.json({ success: false, message: error.message });
      }

      return res.end();
    });
  });
};

["preview", "publish", "importCourse"].forEach( function (el, index, array) {
  OutputManager.prototype[el] = function () {
    var callargs = arguments;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args[args.length - 1];

    this.getOutputPlugin(type, function (error, plugin) {
      if (error) {
        return cb(error);
      }

      return plugin[el].apply(plugin, args);

    });
  };
});

exports = module.exports = {
  // expose the output manager constructor
  OutputManager : OutputManager,

  // expose the output plugin constructor
  OutputPlugin  : OutputPlugin,

  /**
   * preload function
   *
   * @param {object} app - AdaptBuilder instance
   * @return {object} preloader - an AdaptBuilder ModulePreloader
   */
  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events: this.preloadHandle(app, new OutputManager()) });
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
          if(modloaded === WAITFOR){
            app.outputmanager = instance;
            instance.setupRoutes();
            preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
          }
        }
      };
  }

};
