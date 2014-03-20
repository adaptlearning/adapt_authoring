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
      res.json({ success: false });
      return res.end();
    }

    req.logIn(user, function (error) {
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      res.json({
        success: true,
        id: user._id,
        email: user.email
      });

      return res.end();
    });
  })(req, res, next);
};

LocalAuth.prototype.disavow = function (req, res, next) {
  req.logout();
  res.statusCode = 200;
  res.json({ success: true });
  return res.end();
};

LocalAuth.prototype.registerUser = function (req, res, next) {
  // presently, all we need is email and password
  var user = {
    email: req.body.email,
    password: req.body.password
  };

  this.internalRegisterUser(user, function (error, user) {
    if (error) {
      return next(error);
    }

    res.statusCode = 200;
    return res.json({ _id:user._id, email: user.email });

  });

};

LocalAuth.prototype.internalRegisterUser = function (user, cb) {
  if (!user.email || !user.password) {
    return cb(new auth.errors.UserRegistrationError('email and password are required!'));
  }

  // create user with hashed password
  auth.hashPassword(user.password, function (error, hash) {
    if (error) {
      return cb(error);
    }

    user.password = hash;
    user.auth = 'local';
    usermanager.createUser(user, function (error, user) {
      if (error) {
        return cb(error);
      }

      // successfully registered
      return cb(null, user);
    });
  });
}

// module exports
exports = module.exports = LocalAuth;
