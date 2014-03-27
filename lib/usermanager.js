/**
 * User management module
 */

var util = require('util'),
    database = require('./database'),
    logger = require('./logger'),
    tenantmanager = require('./tenantmanager'),
    configuration = require('./configuration');

/*
 * CONSTANTS
 */
var MAX_TOKEN_AGE = 2; // in hours

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
   * creates a user
   *
   * @param {object} user - a fully defined user object
   * @param {function} callback - function of the form function (error, user)
   */
  createUser: function (user, callback) {

    // schema defines email as required, but for searching check that email is defined
    if (!user.email || 'string' !== typeof user.email) {
      callback(new UserEmailError('User email is required!'));
      return;
    }

    database.getDatabase(function(err,db){
      // verify the user email does not already exist
      db.retrieve('User', { email: user.email }, function (error, results) {
        if (error) {
          callback(error);
        } else if (results && results.length) {
          // user exists
          callback(new DuplicateUserError());
        } else {
          db.create('User', user, function (error, result) {
            // wrap the callback since we might want to alter the result
            if (error) {
              logger.log('error', 'Failed to create user: ', user);
              callback(error);
            } else {
              callback(null, result);
            }
          });
        }
       });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves users matching the search
   *
   * @param {object} search - fields of user that should be matched
   * @param {function} callback - function of the form function (error, users)
   */
  retrieveUsers: function (search, callback) {
    database.getDatabase(function(err,db){
      // delegate to db retrieve method
      db.retrieve('User', search, callback);
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single user
   *
   * @param {object} search - fields to match: should use 'email' which is unique
   * @param {function} callback - function of the form function (error, user)
   */
  retrieveUser: function (search, callback) {
    database.getDatabase(function(err,db){
      db.retrieve('User', search, function (error, results) {
        if (error) {
          callback(error);
        } else if (results && results.length > 0) {
          if (results.length === 1) {
            // we only want to retrieve a single user, so we send an error if we get multiples
            callback(null, results[0]);
          } else {
            callback(new Error('User search expected a single result but returned ' + results.length + ' results'));
          }
        } else {
          callback(null, false);
        }
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
          db.update('User', search, update, callback);
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
          db.destroy('User', user, callback);
        }, configuration.getConfig('dbName'));
      } else {
        callback(new Error('No matching user record found'));
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
   * Used with sessions to serialize user data
   * Only serializes the _id and tenant vars
   *
   * @param {object} data - the user to serialize
   * @param {callback} cb
   */
  serializeUser: function (data, cb) {
    if ('0' === data.tenant) { // no tenant for user, default to master
      return cb(null, { _id: data._id, email: data.email, tenant: { name: 'default', database: { dbName: configuration.getConfig('dbName') } } } );
    }

    tenantmanager.retrieveTenant({ _id : data.tenant }, function (error, tenant) {
      if (error) {
        return cb(error);
      }

      cb(null, { _id: data._id, email: data.email, tenant: tenant });
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
  createUserPasswordReset: function (userReset, callback) {
    // schema defines email as required, but for searching check that email is defined
    if (!userReset.email || 'string' !== typeof userReset.email) {
      callback(new UserEmailError('User email is required!'));
      return;
    }

    this.retrieveUser({email: userReset.email}, function (error, user) {
      if (error) {
        callback(error);
      } else if (user) {
        database.getDatabase(function(err,db) {

          db.retrieve('UserPasswordReset', {user: user._id}, function (error, results) {
            if (error) {
              callback(error);
            } else if (results && results.length) {
              // User already submitted a password reset request - update it
              userReset.user = user._id;
              db.update('UserPasswordReset', {user:user._id}, userReset, function (error, result) {
                if (error) {
                  logger.log('error', 'Failed to update user password reset: ', user);
                  callback(error);
                } else {
                  callback(null, result);
                }
              });
            } else {
              // Create password reset token
              userReset.user = user._id;
              db.create('UserPasswordReset', userReset, function (error, result) {
                if (error) {
                  logger.log('error', 'Failed to create user password reset: ', user);
                  callback(error);
                } else {
                  callback(null, result);
                }
              });
            }
          });

        }, configuration.getConfig('dbName'));
      } else {
        // If the user doesn't exist, don't throw an error - this is to prevent
        // users guessing correct usernames
        callback(false, {invalid:true});
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
            if (resetRequest.tokenCreated.getTime() > timestampMinAge) {
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
        callback(error);
      } else if (result) {
        database.getDatabase(function(err,db){
          db.destroy('UserPasswordReset', user, callback);
        }, configuration.getConfig('dbName'));
      } else {
        callback(new Error('No matching user password reset record found'));
      }
    });
  },

  /**
   * Sets a users password to the provided value
   * @param {object} user - must match the user in db
   * @param {function} callback - function of the form function (error)
   */
  resetUserPassword: function (user, callback) {
    if (!user.token) {
      callback(new Error('No user password reset token provided'));
    }
    var usermanager = this;
    var timestampMinAge = this.xHoursAgo(MAX_TOKEN_AGE);

    this.retrieveUserPasswordReset({token:user.token}, function (err, resetRequest) {
      if (err) {
        // Token is too old
        callback(err, false);
      }

      if (resetRequest.tokenCreated.getTime() > timestampMinAge) {
        usermanager.updateUser({_id:user.id}, user, function(err) {
          if (err) {
            callback(err, false);
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
   * Utility - return time in milliseconds x hours ago
   * @param {int} hours - the number of hours ago to fetch
   */
  xHoursAgo: function (hours) {
    var now = new Date();
    return now.getTime() - (1000 * 60 * 60 * hours);
  },

  init: function (app) {
    var usermanager = this;

      var rest = require('./rest');
      var auth = require('./auth');

      rest.get('/user/me', function (req, res, next) {
        var usr = req.session.passport.user;//@todo : why didn't this work?? usermanager.getCurrentUser();

        if( usr ){
          usermanager.retrieveUser({_id:usr._id}, function (err, usr){

            if( err ){
              res.statusCode = 500;
              res.json(err);
              return res.end();
            }

            res.statusCode = 200;
            res.json(usr);
            return res.end();

          });
        } else {
          res.statusCode = 400;
          res.json(false);
          return res.end();
        }
      });

      rest.put('/user/me', function (req, res, next) {
        var usr = req.session.passport.user;//@todo : why didn't this work?? usermanager.getCurrentUser();
        var val = req.body;

        if (!val || 'object' !== typeof val) {
          res.statusCode = 400;
          res.json({success: false, message: 'request body was not a valid object'});
          return res.end();
        }

        if( usr ){
          if( usr._id !== val._id ){
            res.statusCode = 400;
            res.json({success: false, message: 'Trying to update wrong user'});
            return res.end();
          }

          //remove attributes we don't want to be updated
          delete val.id;
          delete val._id;

          auth.hashPassword(val.password, function( err, hash){
            if( err ){
              res.statusCode = 500;
              res.json(err);
              return res.end();
            }

            val.password = hash;

            usermanager.updateUser( { email: val.email }, val, function( err ){
              if( err ){
                res.statusCode = 500;
                res.json(err);
                return res.end();
              }

              res.statusCode = 200;
              res.json({success:true});
              return res.end();
            });
          });

          return false;

          /*usermanager.retrieveUser({_id:usr._id}, function (err, usr){

            if( err ){
              res.statusCode = 500;
              res.json(err);
              return res.end();
            }

            res.statusCode = 200;
            res.json(usr);
            return res.end();

          });*/
        } else {
          res.statusCode = 400;
          res.json(false);
          return res.end();
        }
      });

      rest.get('/user/:id[a-z0-9_]+', function (req, res, next) {
        var uid = req.params.type;

        if( uid ){
          usermanager.retrieveUser({_id:uid}, function (err, usr){

            if( err ){
              res.statusCode = 500;
              res.json(err);
              return res.end();
            }

            res.statusCode = 200;
            res.json(usr);
            return res.end();

          });
        } else {
          res.statusCode = 400;
          res.json(false);
          return res.end();
        }
      });

      rest.get('/userpasswordreset/:token', function (req, res, next) {
        var token = req.params.token;

        if (token) {
          usermanager.retrieveUserPasswordReset({token:token}, function (err, usrReset) {
            res.statusCode = 200;
            if (err) {
              res.json(err);
            } else {
             res.json(usrReset);
            }
            return res.end();
          });
        } else {
          res.statusCode = 400;
          res.json(false);
          return res.end();
        }
      });
  }
};