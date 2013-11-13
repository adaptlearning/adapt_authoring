/**
 * offers passport-local style authentication
 */

var auth = require('../../../lib/auth'),
    configuration = require('../../../lib/configuration'),
    usermanager = require('../../../lib/usermanager'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var MESSAGES = {
  INVALID_DETAILS: 'invalid details'
};

function LocalAuth() {
  this.strategy = new LocalStrategy({ usernameField: 'email' }, this.verifyUser);
  passport.use(this.strategy);
}

util.inherits(LocalAuth, auth.AuthPlugin);

LocalAuth.prototype.init = function (app) {
};

LocalAuth.prototype.verifyUser = function (email, password, done) {
  // retrieve the user and compare details with those provided
  usermanager.retrieveUser({ email: email, auth: 'local' }, function (error, user) {
    if (error) {
      return done(error);
    }

    if (!user) {
      return done(null, false, { message: MESSAGES.INVALID_DETAILS });
    }

    // validate the user's password
    auth.validatePassword(password, user.password, function (error, valid) {
      if (error) {
        return done(error);
      }

      // did password check out?
      if (!valid) {
        return done(null, false, { message: MESSAGES.INVALID_DETAILS });
      }

      return done(null, user);
    });
  });
};

LocalAuth.prototype.authenticate = function (req, res, next) {
  return passport.authenticate('local', function (error, user, info) {
    if (error) {
      return next(error);
    }

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.send({ success: false });
      return res.end();
    }

    req.logIn(user, function (error) {
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.send({ success: true });
      return res.end();
    });
  })(req, res, next);
};

LocalAuth.prototype.registerUser = function (req, res, next) {
  // presently, all we need is email and password
  var user = {
    email: req.body.email,
    password: req.body.password
  };

  if (!user.email || !user.password) {
    return next({ statusCode: 400, message: 'email and password are required!' });
  }

  // create user with hashed password
  auth.hashPassword(user.password, function (error, hash) {
    if (error) {
      return next({ statusCode: 500, message: error });
    }

    user.password = hash;
    user.auth = 'local';
    usermanager.createUser(user, function (error, user) {
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      // successfully registered
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.send({ _id: user._id, email: user.email });
      res.end();
    });
  });
};

// module exports
exports = module.exports = LocalAuth;
