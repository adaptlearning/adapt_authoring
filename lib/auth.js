/**
 * Auth plugins are a wrapper for passportjs strategies.
 *
 */

var path = require('path'),
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

function AuthPlugin() {
  this.type = 'none';
}

AuthPlugin.prototype.init = function (app) {
  throw new Error('AuthPlugin#init must be overridden in extending object');
};

AuthPlugin.prototype.authenticate = function (req, res, next) {
  throw new Error('AuthPlugin#authenticate must be overridden in extending object');
};

AuthPlugin.prototype.registerUser = function (user, cb) {
  throw new Error('AuthPlugin#registerUser must be overridden in extending object');
};

exports = module.exports = {

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
   * preload function
   *
   * @param {object} app - AdaptBuilder instance
   */

  preload: function (app) {
    // set up (de)serialization
    passport.serializeUser(usermanager.serializeUser.bind(usermanager));
    passport.deserializeUser(usermanager.deserializeUser.bind(usermanager));

    // defer route addition until after serverStarted is fired
    // otherwise there are issues with middleware
    var that = this;
    app.once('serverStarted', function (app) {
      rest.post('/login', function (req, res, next) {
        that.getAuthPlugin(configuration.getConfig('auth'), function (error, authPlugin) {
          if (error) {
            return next({ statusCode: 500, message: error }, req, res);
          }

          authPlugin.authenticate(req, res, next);
        });
      });

      rest.post('/register', function (req, res, next) {
        that.getAuthPlugin(configuration.getConfig('auth'), function (error, authPlugin) {
          if (error) {
            return next({ statusCode: 500, message: error }, req, res);
          }

          authPlugin.registerUser(req, res, next);
        });
      });

      rest.get('/authcheck', function (req, res, next) {
        var user = req.session.passport.user;
        var result = {
          authenticated: (user && user._id) ? true : false
        };

        res.statusCode = 200;
        res.json(result);
        return res.end();
      });
    });
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
