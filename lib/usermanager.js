// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * User management module
 */

var util = require('util'),
  database = require('./database'),
  logger = require('./logger'),
  tenantmanager = require('./tenantmanager'),
  rolemanager = require('./rolemanager'),
  pluginmanager = require('./pluginmanager'),
  permissions = require('./permissions')
  mailer = require('./mailer'),
  async = require('async'),
  _ = require('underscore'),
  configuration = require('./configuration');

/*
 * CONSTANTS
 */
var MAX_TOKEN_AGE = 2; // in hours
var PROTECTED_SESSION_KEYS = { passport: 1, cookie: 1 }; // don't allow direct setting of these session vars
const UNDEFINED_TENANT_ID = '000000000000000000000000';

// custom errors
function UserEmailError (message) {
  this.name = 'UserEmailError';
  this.message = message || 'User email error';
}

util.inherits(UserEmailError, Error);

function UserCreateError (message) {
  this.name = 'UserCreateError';
  this.message = message || 'User create error';
}

util.inherits(UserCreateError, Error);

function DuplicateUserError (message) {
  this.name = 'DuplicateUserError';
  this.message = message || 'User already exists';
}

util.inherits(DuplicateUserError, Error);

exports = module.exports = {

  // expose errors
  errors: {
    'UserEmailError': UserEmailError,
    'UserCreateError': UserCreateError,
    'DuplicateUserError': DuplicateUserError
  },

  /**
   * checks if a user is permitted the action on the resource
   *
   * @param {string} action
   * @param {object} user
   * @param {string} resource
   * @param {callback} next (function (err, isAllowed))
   */

  hasPermission: function(action, user, resource, next) {
    var resourceString = permissions.buildResourceString(user.tenant._id, resource);
    permissions.hasPermission(user._id, action, resourceString, next);
  },

  createNewUser: function(user, callback) {
    var auth = require('./auth');

    auth.getAuthPlugin(configuration.getConfig('auth'), function (err, plugin) {
      if (err) {
        return callback(err);
      }

      plugin.internalRegisterUser(user, function(error, result) {
        if (error) {
          return callback(error);
        }

        app.rolemanager.assignRoleByName('Authenticated User', result._id, function (err) {
          if (err) {
            return callback(err);
          }

          return callback(null, result);
        });
      });
    });
  },

  /**
   * Finds or creates a new user account
   *
   * @param {object} search     - search criteria
   * @param {string} authType   - authentication type
   * @param {object} profile    - a user profile (only used if the user does not exist)
   * @param {function} callback - function of the form (error, user)
   */
  findOrCreateUser: function(search, authType, profile, next) {
    // Verify that a property exists which is unique enough to search on.
    if (!search.hasOwnProperty('_id') && !search.hasOwnProperty('idNumber') && !search.hasOwnProperty('email')) {
      return next(new Error("You must specify one of '_id', 'idNumber' or 'email'"));
    }

    var self = this;

    // Add 'authType' to the search criteria.
    search = _.extend(search, {auth: authType});

    // Check if the user exists.
    self.retrieveUser(search, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        self.logAccess(user, function(err) {
          if (err) {
            return next(err);
          }

          // Return the found user.
          return next(null, user);
        });
      } else {
        // Set the first access date and the auth type for this new account.
        profile.firstAccess = new Date();
        profile.auth = authType;

        // For a new user, the steps are:
        // 1. Create the user
        // 2. (Optionally) create a new tenant and assign it to the user
        // 3. Assign default roles to the user
        async.waterfall([
          function(callback) {
            // Create the initial user record.
            self.createUser(profile, function(err, user) {
              if (err) {
                logger.log('error', 'Failed to create user: ', profile);
                return callback(err);
              }

              return callback(null, user);
            });
          },
          function(newUser, callback) {
            // Create a new tenant (if required)
            if (!profile.hasOwnProperty('_tenantId') || profile._tenantId == UNDEFINED_TENANT_ID) {
              // Formulate a unique tenant name.
              var tenantName = '${profile.auth}-${newUser._id}';

              // Setup a new tenant for the new user.
              tenantmanager.createTenant({name: tenantName}, function(err, tenant) {
                if (err) {
                  logger.log('error', 'Failed to create new tenant for user: ', profile);
                  return callback(err);
                }

                // Set the newly created tenant with the user.
                self.updateUser({_id: newUser._id}, {_tenantId: tenant._id}, function(err, user) {
                  if (err) {
                    return callback(err);
                  }

                  return callback(null, user);
                });
              });
            } else {
             callback(null);
            }
          },
          function(newUser, callback) {
            // Assign default roles to the user.
            rolemanager.assignDefaultRoles(newUser._id, function(err) {
              if (err) {
                return callback(err);
              }

              return callback(null, newUser);
            });
          }
        ], function(err, result) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          // Return the new user.
          return next(null, result);
        });
      }
    });
  },

  /**
   * creates a user
   *
   * @param {object} user - a fully defined user object
   * @param {function} callback - function of the form function (error, user)
   */
  createUser: function (user, callback) {

    // schema defines email as required, but for searching check that email is defined
    if (!user.email || 'string' !== typeof user.email) {
      return callback(new UserEmailError('user email is required!'));
    }

    database.getDatabase(function(err, db){
      if (err) {
        return callback(err);
      }

      // verify the user email does not already exist
      db.retrieve('user', { email: user.email }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length) {
          // user exists
          return callback(new DuplicateUserError());
        } else {
          db.create('user', user, function (error, result) {
            // Wrap the callback since we might want to alter the result
            if (error) {
              logger.log('error', 'Failed to create user: ', user);
              return callback(error);
            }

            return callback(null, result);
          });
        }
       });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves users matching the search
   *
   * @param {object} search - fields of user that should be matched
   * @param {object} [options] - optional options to pass to db
   * @param {function} callback - function of the form function (error, users)
   */
  retrieveUsers: function (search, options, callback) {
    database.getDatabase(function(err,db){
      // delegate to db retrieve method
      db.retrieve('user', search, options, callback);
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single user
   *
   * @param {object} search - fields to match: should use 'email' which is unique
   * @param {object} [options] - optional options to pass to db
   * @param {function} callback - function of the form function (error, user)
   */
  retrieveUser: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    database.getDatabase(function(err,db) {
      db.retrieve('user', search, options, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length > 0) {
          if (results.length === 1) {
            // we only want to retrieve a single user, so we send an error if we get multiples
            return callback(null, results[0]);
          }

          return callback(new Error('user search expected a single result but returned ' + results.length + ' results'));
        }

        return callback(null, false);
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * updates a single user
   *
   * @param {object} search - fields to match: should use 'email' which is unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, user)
   */
  updateUser: function (search, update, callback) {
    // only execute if we have a single matching record
    this.retrieveUser(search, function (error, result) {
      if (error) {
        callback(error);
      } else if (result) {
        database.getDatabase(function(err,db){
          db.update('user', search, update, callback);
        }, configuration.getConfig('dbName'));
      } else {
        callback(new Error('No matching user record found'));
      }
    });
  },

  /**
   * sets the 'active' state of a single user. Preferred to a hard delete.
   * Really just a shorthand for this.updateUser
   *
   * @param {object} user - must match the user in db
   * @param {boolean} active - the active state, true or false
   * @param {function} callback - function of the form function (error)
   */
  setUserActive: function (user, active, callback) {
    // confirm the user exists and is there is only one of them
    this.retrieveUser(user, function (error, result) {
      if (error) {
        callback(error);
      } else if (result) {
        this.updateUser({ '_id': result._id }, { 'active': active }, callback);
      } else {
        callback(new Error('No matching user record found'));
      }
    });
  },

  /**
   * deletes a single user
   *
   * @param {object} user - must match the user in db
   * @param {function} callback - function of the form function (error)
   */
  deleteUser: function (user, callback) {
    // confirm the user exists and is there is only one of them
    this.retrieveUser(user, function (error, result) {
      if (error) {
        callback(error);
      } else if (result) {
        database.getDatabase(function(err,db){
          db.destroy('user', user, callback);
        }, configuration.getConfig('dbName'));
      } else {
        // consider deleting a non-existent record a success
        callback(null);
      }
    });
  },

  /**
   * get's the currently logged in user session
   *
   */
  getCurrentUser: function () {
    var session = process.domain && process.domain.session;
    var user = (session && session.passport && session.passport.user)
      ? session.passport.user
      : false;

    return user;
  },

  /**
   * saves a variable in the current session
   *
   * @param {string} key - the name of the variable
   * @param {mixed} value - the value to save
   */

  setSessionVariable: function (key, value) {
    var session = process.domain && process.domain.session;
    // protect some variable names
    if (PROTECTED_SESSION_KEYS[key]) {
      return false;
    }

    // ok, good to go
    return session && (session[key] = value);
  },

  /**
   * gets a session variable, if set
   *
   * @param {string} key - the variable name
   * @return {mixed} the value if it exists, otherwise false
   */

  getSessionVariable: function (key) {
    var session = process.domain && process.domain.session;

    return (session && session[key]);
  },

  /**
   * Used with sessions to serialize user data
   * Only serializes the _id and tenant vars
   *
   * @param {object} data - the user to serialize
   * @param {callback} cb
   */
  serializeUser: function (data, cb) {
    var user = {
        _id: data._id,
        email: data.email,
        tenant: {}
    };

    if (data._tenantId == UNDEFINED_TENANT_ID) {
      // No tenant defined for user, so default to master.
      user.tenant = {
        _id: configuration.getConfig('masterTenantID'),
        name: configuration.getConfig('masterTenantName'),
        isMaster: true
      };

      return cb(null, user);
    }

    tenantmanager.retrieveTenant({ _id : data._tenantId }, function (error, tenant) {
      if (error) {
        return cb(error);
      }

      if (!tenant) {
        logger.log('error', 'Unable to retrieve tenant ${data._tenantId} for user ${data._id}');
        return cb(new Error('Unable to retrieve tenant for user'));
      }

      user.tenant = {
        _id: tenant._id,
        name: tenant.name,
        isMaster: tenant.isMaster
      };

      cb(null, user);
    });
  },

  /**
   * Used with sessions to retrieve a user based on serialized data
   *
   * @param {object} data - the user to restore
   * @param {callback} cb
   */
  deserializeUser: function (data, cb) {
    this.retrieveUser( { _id: data._id, email: data.email }, function (error, rec) {
      cb(error, rec);
    });
  },

  /**
   * Creates a user password reset entry
   *
   * @param {object} userReset - a fully defined user reset object
   * @param {function} callback - function of the form function (error, user)
   */
  createUserPasswordReset: function (userReset, next) {
    // schema defines email as required, but for searching check that email is defined
    if (!userReset.email || 'string' !== typeof userReset.email) {
      return next(new UserEmailError('User email is required!'));
    }

    this.retrieveUser({email: userReset.email, auth: 'local'}, function (error, user) {
      if (error) {
        return next(error);
      } else if (user) {
        database.getDatabase(function(err, db) {
          if (err) {
            logger.log('error', error);
            return next(error)
          }

          db.retrieve('userpasswordreset', {user: user._id}, function (error, results) {
            if (error) {
              logger.log('error', error);
              return next(error);
            } else if (results && results.length) {
              // User already submitted a password reset request - update it
              userReset.user = user._id;

              db.update('userpasswordreset', {user:user._id}, userReset, function (error, result) {
                if (error) {
                  logger.log('error', 'Failed to update user password reset: ', user);
                  return next(error);
                } else {
                  return next(null, result);
                }
              });
            } else {
              // Create password reset token
              userReset.user = user._id;

              db.create('userpasswordreset', userReset, function (error, result) {
                if (error) {
                  logger.log('error', 'Failed to create user password reset: ', user);
                  return next(error);
                } else {
                  return next(null, result);
                }
              });
            }
          });

        }, configuration.getConfig('dbName'));
      } else {
        // If the user doesn't exist, don't throw an error - this is to prevent
        // users guessing correct usernames
        return next(false, {invalid:true});
      }
    });
  },

  /**
   * Retrieves a single user password reset
   *
   * @param {object} search - fields to match: should use 'token' which is unique
   * @param {function} callback - function of the form function (error, userReset)
   */
  retrieveUserPasswordReset: function (search, callback) {
    var timestampMinAge = this.xHoursAgo(MAX_TOKEN_AGE);

    database.getDatabase(function(err, db) {
      db.retrieve('UserPasswordReset', search, function (error, results) {
        if (error) {
          callback(error);
        } else if (results && results.length > 0) {
          // we only want to retrieve a single user, so we send an error if we get multiples
          if (results.length === 1) {
            var resetRequest = results[0];

            // Ensure the request is still within the valid timeframe
            if (resetRequest.issueDate.getTime() > timestampMinAge) {
              callback(null, resetRequest);
            } else {
              // Token is too old
              callback(new Error('Reset token has expired'), false);
            }
          } else {
            callback(new Error('User password reset search expected a single result but returned ' + results.length + ' results'));
          }
        } else {
          callback(null, false);
        }
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * Deletes a single user password reset
   *
   * @param {object} user - must match the user in db
   * @param {function} callback - function of the form function (error)
   */
  deleteUserPasswordReset: function (user, callback) {
    // confirm the user password reset exists and is there is only one of them
    this.retrieveUserPasswordReset(user, function (error, result) {
      if (error) {
        return callback(error);
      }

      if (result) {
        return database.getDatabase(function (err, db) {
          if (err) {
            return callback(err);
          }

          db.destroy('UserPasswordReset', user, callback);
        }, configuration.getConfig('dbName'));
      }

      // nothing to delete
      return callback(null);
    });
  },

  /**
   * Sets a users password to the provided value
   * @param {object} user - must match the user in db
   * @param {function} callback - function of the form function (error)
   */
  resetUserPassword: function (user, callback) {
    if (!user.token) {
      return callback(new Error('No user password reset token provided'));
    }
    var usermanager = this;
    var timestampMinAge = this.xHoursAgo(MAX_TOKEN_AGE);

    this.retrieveUserPasswordReset({token:user.token}, function (err, resetRequest) {
      if (err) {
        // Token is too old
        return callback(err, false);
      }

      if (resetRequest.issueDate.getTime() > timestampMinAge) {
        usermanager.updateUser({_id:user.id}, user, function(err) {
          if (err) {
            return callback(err, false);
          }
          callback(null, user);
        });
      } else {
        // Token is too old
        callback(new Error('Reset token has expired'), false);
      }
    });
  },

  /**
   * Stamps the user's lastAccess date/time and ensures
   * firstAccess is set
   * @param {object} user - a valid instance of the user
   */
  logAccess: function(user, callback) {
    var currentTime = new Date();
    var delta = {};

    if (!user.firstAccess) {
      delta.firstAccess = currentTime;
    }

    delta.lastAccess = currentTime;

    // Reset the count of any failed logins
    delta.failedLoginCount = 0;

    this.updateUser({_id: user._id}, delta, function(error) {
      if (error) {
        return callback(error);
      }

      callback();
    });
  },

  /**
   * Utility - return time in milliseconds x hours ago
   * @param {int} hours - the number of hours ago to fetch
   */
  xHoursAgo: function (hours) {
    var now = new Date();
    return now.getTime() - (1000 * 60 * 60 * hours);
  },

  init: function (app) {
    var self = this;
    var rest = require('./rest');
    var auth = require('./auth');

    // yep
    app.usermanager = this;

    // Get all users
    rest.get('/user', function(req, res, next) {
      var search = req.query.search || {};
      var orList = [];
      var exp = {};
      if (search.email) {
        exp['email'] = new RegExp(search['email'], 'i');
        orList.push(exp);
      }

      var query = {};
      if (orList.length) {
        query.$or = orList;
      }

      self.retrieveUsers(query, { populate: { 'roles' : 'name', '_tenantId' : 'name' } }, function(err, users) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json(users);
      });
    });

    // Get all users
    rest.get('/user/query', function(req, res, next) {


      var options = _.keys(req.body).length
        ? req.body
        : req.query;
      var search = options.search || {};
      var orList = [];
      var andList = [];

      // convert searches to regex
      async.each(Object.keys(search),
        function (key, nextKey) {
          var exp = {};
          // convert strings to regex for likey goodness
          if ('string' === typeof search[key]) {
            exp[key] = new RegExp(search[key], 'i');
            orList.push(exp);
          } else {
            exp[key] = search[key];
            andList.push(exp);
          }
          nextKey();
        }, function () {
          var query = {};
          if (orList.length) {
            query.$or = orList;
          }

          if (andList.length) {
            query.$and = andList;
          }

          options.populate = {
            'roles' : 'name',
            '_tenantId' : 'name'
          };

          self.retrieveUsers(query, options, function(err, users) {

            if (err) {
              return next(err);
            }

            // user was not found
            if (!users) {
              res.statusCode = 404;
              return res.json({ success: false, message: 'users not found' });
            }

            res.statusCode = 200;
            return res.json(users);
          });

      });


    });

    rest.get('/user/me', function (req, res, next) {
      var usr = self.getCurrentUser();

      if (usr) {
        self.retrieveUser({ _id:usr._id }, function (err, usr) {
          if (err) {
            res.statusCode = 500;
            return res.json(err);
          }

          res.statusCode = 200;
          return res.json(usr);
        });
      } else {
        res.statusCode = 400;
        return res.json(false);
      }
    });

    rest.post('/user/resetpassword', function(req, res, next) {
      var user = self.getCurrentUser();
      var delta = req.body;

      if (!delta || 'object' !== typeof delta) {
        res.statusCode = 400;
        return res.json({success: false, message: 'request body was not a valid object'});
      }

      self.hasPermission('update', user, '/api/user/resetpassword', function(err, isAllowed) {
        if (err) {
          res.statusCode = 500;
          return res.json(err);
        }

        if (!isAllowed) {
          res.statusCode = 401;
          return res.json({success: false, message: 'Access denied'});
        }

        // Sanatize the input
        delta = _.pick(delta, 'email', 'password');
        var plainTextPassword = delta.password;

        auth.hashPassword(delta.password, function(err, hash) {
          if (err) {
            res.statusCode = 500;
            return res.json(err);
          }

          delta.password = hash;
          delta.failedLoginCount = 0;

          self.updateUser({email: delta.email}, delta, function(err) {
            if (err) {
              res.statusCode = 500;
              return res.json(err);
            }

            var subject = app.polyglot.t('app.emailadminpasswordresetsubject');
            var body = app.polyglot.t('app.emailadminpasswordresetbody', {data: plainTextPassword});

            app.mailer.send(delta.email, subject, body, function(error) {
              if (error) {
                logger.log('error', error);
              } else {
                logger.log('info', 'Password reset by administrator for ' + delta.email);
              }

              res.statusCode = 200;
              return res.json({success: true});
            });
          });
        });
      });
    });

    rest.put('/user/me', function (req, res, next) {
      var user = self.getCurrentUser();
      var delta = req.body;

      if (!delta || 'object' !== typeof delta) {
        res.statusCode = 400;
        return res.json({success: false, message: 'request body was not a valid object'});
      }

      if (user) {
        if (user._id !== delta._id) {
          res.statusCode = 400;
          return res.json({success: false, message: 'Trying to update wrong user'});
        }

        if (delta._isNewPassword) {
          // Update the password
          logger.log('info', 'Resetting password for ' + delta.email + '(' + user._id + ')');

          auth.hashPassword(delta.password, function(err, hash) {
            if (err) {
              res.statusCode = 500;
                return res.json(err);
            }

            delta.password = hash;

            self.updateUser({email: delta.email}, delta, function(err) {
              if (err) {
                res.statusCode = 500;
                return res.json(err);
              }

              res.statusCode = 200;
              return res.json({success: true});
            });

          });
        } else {
          self.updateUser({email: delta.email}, delta, function(err) {
            if (err) {
              res.statusCode = 500;
              return res.json(err);
            }

            res.statusCode = 200;
            return res.json({success:true});
          });
        }
      } else {
        res.statusCode = 400;
        return res.json(false);
      }
    });

    rest.get('/user/:id', function (req, res, next) {
      var id = req.params.id;

      if ('string' !== typeof id) {
        return next(new Error('id must be a valid objectid!'));
      }

      self.retrieveUser({ _id: id }, { populate: { 'roles' : 'name', '_tenantId' : 'name' } }, function (err, usr) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json(usr);
      });
    });

     // Create new user
    rest.post('/user', function (req, res, next) {
      var userData = req.body;

      self.createNewUser(userData, function (err, result) {
        if (err) {
          res.statusCode = 500;
          return next(err);
        }

        res.statusCode = 200;
        return res.json(result);
      });
    });

    rest.put('/user/:id', function (req, res, next) {
      var id = req.params.id;
      var delta = req.body;

      // handle puts from prepopulated fields
      if ('object' === typeof delta._tenantId) {
        delta._tenantId = delta._tenantId._id;
      }

      // roles aren't set this way
      if (delta.roles) {
        delete delta.roles;
      }

      self.updateUser({ _id: id }, delta, function (err, result) {
        if (err) {
          return next(err);
        }

        // update was successful
        res.statusCode = 200;
        return res.json(result);
      });
    });

    rest.put('/user/bulkaction', function (req, res, next) {
      var delta = false;
      if (req.body.type === 'delete') {
        delta = {
          _isDeleted: true
        };

      } else if (req.body.type === 'restore') {
        delta = {
          _isDeleted: false
        };
      }

      if (!delta) {
        res.statusCode = 400;
        return res.json(false);
      }

      async.each(req.body._items, function(itemId, callback) {
        self.updateUser({ _id: itemId }, delta, function (err, result) {
          if (err) {
            return next(err);
          }

          callback();
        });
      }, function(err){
        if (err) {
          return next(err);
        }
        // update was successful
        res.statusCode = 200;
        return res.json(req.body._items);
      });

    });

    rest.get('/userpasswordreset/:token', function (req, res, next) {
      var token = req.params.token;

      if (token) {
        self.retrieveUserPasswordReset({ token: token }, function (err, usrReset) {
          res.statusCode = 200;
          if (err) {
            return res.json(err);
          }

          return res.json(usrReset);
        });
      } else {
        res.statusCode = 400;
        return res.json(false);
      }
    });
  }
};
