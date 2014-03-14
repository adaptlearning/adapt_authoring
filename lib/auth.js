/**
 * Auth plugins are a wrapper for passportjs strategies.
 *
 */

var path = require('path'),
    util = require('util'),
    bcrypt = require('bcrypt-nodejs'),
    passport = require('passport'),
    configuration = require('./configuration'),
    logger = require('./logger'),
    rest = require('./rest'),
    pluginmanager = require('./pluginmanager'),
    permissions = require('./permissions'),
    usermanager = require('./usermanager');

// private hash for memoizing auth plugins
var _authPlugins = Object.create(null);

/*
 * CONSTANTS
 */
var MODNAME = 'authentication',
    WAITFOR = 'pluginmanager';

// custom errors
function UserRegistrationError (message) {
  this.name = 'UserRegistrationError';
  this.message = message || 'User registration error';
}

util.inherits(UserRegistrationError, Error);

function AuthPlugin() {
  this.type = 'none';
}

AuthPlugin.prototype.init = function (app) {
  throw new Error('AuthPlugin#init must be overridden in extending object');
};

AuthPlugin.prototype.authenticate = function (req, res, next) {
  throw new Error('AuthPlugin#authenticate must be overridden in extending object');
};

AuthPlugin.prototype.disavow = function (req, res, next) {
  throw new Error('AuthPlugin#disavow must be overridden in extending object');
};

AuthPlugin.prototype.registerUser = function (req, res, next) {
  throw new Error('AuthPlugin#registerUser must be overridden in extending object');
};

AuthPlugin.prototype.internalRegisterUser = function (user, cb) {
  throw new Error('AuthPlugin#internalRegisterUser must be overridden in extending object');
};

exports = module.exports = {

  errors: {
    'UserRegistrationError' : UserRegistrationError
  },

  /**
   * Exposes plugin object
   *
   */

  AuthPlugin: AuthPlugin,

  /**
   * hashes a password using bcrypt
   *
   * @param {string} password - plaintext password
   * @param {callback} cb - func (err, hash)
   */

  hashPassword: function (password, cb) {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, null, cb);
    });
  },

  /**
   * checks a plaintext password against a stored hash
   *
   * @param {string} password - plaintext password
   * @param {string} hash - stored hash
   * @param {callback} cb - func (err, valid)
   */

  validatePassword: function (password, hash, cb) {
    bcrypt.compare(password, hash, cb);
  },

  /**
   * wrapper for passport.session
   *
   */

  session: function () {
    return passport.session();
  },

  /**
   * wrapper for passport.initialize
   *
   */

  initialize: function () {
    return passport.initialize();
  },

  /**
   * preload function sets up event listener for startup events
   *
   * @param {object} app - the AdaptBuilder instance
   * @return {object} preloader - an AdaptBuilder ModulePreloader
   */
  preload: function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, {events:preloadHandle(app,this)});
    return preloader;
  },

  /**
   * gets the authentication plugin of the specified name
   *
   * @param {string} name - the name of the plugin
   * @param {callback} cb - func(err, plugin)
   */
  getAuthPlugin: function (name, cb) {
    // early return if we have fetched it before
    if (_authPlugins[name] && _authPlugins[name] instanceof AuthPlugin) {
      return cb(null, _authPlugins[name]);
    }

    var pluginManager = pluginmanager.getManager();
    pluginManager.getPlugin('auth', name, function (error, pluginInfo) {
      if (error) {
        logger.log('error', 'Failed to retrieve auth plugin', error);
        return cb(error);
      }

      try {
        var Auth = require(pluginInfo.fullPath);
        _authPlugins[name] = new Auth();
        return cb(null, _authPlugins[name]);
      } catch (err) {
        return cb(err);
      }

    });
  }
};

/**
 * Event handler for preload events
 *
 * @param {object} app - Server instance
 * @param {object} instance - Instance of this module
 * @return {object} hash map of events and handlers
 */
function preloadHandle(app, instance){

  return {
      preload : function(){
        var preloader = this;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
      },

      moduleLoaded : function(modloaded){
        var preloader = this;

         //is the module that loaded this modules requirement
        if(modloaded === WAITFOR){

          preloader.emit('preloadChange', MODNAME, app.preloadConstants.LOADING);

          // set up (de)serialization
          passport.serializeUser(usermanager.serializeUser.bind(usermanager));
          passport.deserializeUser(usermanager.deserializeUser.bind(usermanager));

          rest.post('/login', function (req, res, next) {
            instance.getAuthPlugin(configuration.getConfig('auth'), function (error, authPlugin) {
              if (error) {
                return next({ statusCode: 500, message: error }, req, res);
              }

              authPlugin.authenticate(req, res, next);
            });
          });

          rest.post('/logout', function (req, res, next) {
            instance.getAuthPlugin(configuration.getConfig('auth'), function (error, authPlugin) {
              if (error) {
                return next({ statusCode: 500, message: error }, req, res);
              }

              authPlugin.disavow(req, res, next);
            });
          });

          rest.post('/register', function (req, res, next) {
            instance.getAuthPlugin(configuration.getConfig('auth'), function (error, authPlugin) {
              if (error) {
                return next({ statusCode: 500, message: error }, req, res);
              }

              authPlugin.registerUser(req, res, next);
            });
          });

          rest.get('/authcheck', function (req, res, next) {
            var user = req.session.passport.user;

            var result = {
              isAuthenticated: (user && user._id) ? true : false,
              id: (user && user._id) ? user._id : 0,
              email: (user && user.email) ? user.email : '' // TODO -- This may change
            };

            res.statusCode = 200;
            res.json(result);
            return res.end();
          });

          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        }
      }
    };
};
