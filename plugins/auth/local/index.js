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
};

LocalAuth.prototype.resetPassword = function (req, res, next) {
  var user = {
    id: req.body.user,
    password: req.body.password,
    token: req.body.token
  };

  this.internalResetPassword(user, function (error, user) {
    if (error) {
      return next(error);
    }

    res.statusCode = 200;
    return res.json({ success: true });

  });
};

LocalAuth.prototype.internalResetPassword = function (user, cb) {
  if (!user.id || !user.password) {
    return cb(new auth.errors.UserResetPasswordError('email and password are required!'));
  }

  // Update user details with hashed password
  auth.hashPassword(user.password, function (error, hash) {
    if (error) {
      return cb(error);
    }

    user.password = hash;

    usermanager.resetUserPassword(user, function (error, user) {
      if (error) {
        return next(error);
      }

      // Remove reset request
      usermanager.deleteUserPasswordReset({user:user.id}, function (error, user) {
        if (error) {
          return cb(error);
        }
        //Request deleted, password successfully reset
        return cb(null, user);
      });
    });
  });
};

LocalAuth.prototype.generateResetToken = function (req, res, next) {
  var user = {
    email: req.body.email,
    ipAddress: req.connection.remoteAddress
  };

  this.internalGenerateResetToken(user, function (error, user) {
    if (error) {
      return next(error);
    }

    res.statusCode = 200;
    return res.json({ success: true });

  });
};

LocalAuth.prototype.internalGenerateResetToken = function (user, cb) {
  if (!user.email) {
    return cb(new auth.errors.UserGenerateTokenError('email is required!'));
  }

  auth.createToken(function (error, token) {
    if (error) {
      return cb(error);
    }

    var userReset = {
      email: user.email,
      token: token,
      tokenCreated: new Date(),
      ipAddress: user.ipAddress
    };

    usermanager.createUserPasswordReset(userReset, function (error, user) {
      if (error) {
        return cb(error);
      }

      // Success
      return cb(null, user);
    });
  });
};

// module exports
exports = module.exports = LocalAuth;
