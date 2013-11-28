/**
 * User management module
 */

var util = require('util'),
    database = require('./database'),
    logger = require('./logger'),
    configuration = require('./configuration');

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
    var db = database.getDatabase();

    // schema defines email as required, but for searching check that email is defined
    if (!user.email || 'string' !== typeof user.email) {
      callback(new UserEmailError('User email is required!'));
      return;
    }

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
  },

  /**
   * retrieves users matching the search
   *
   * @param {object} search - fields of user that should be matched
   * @param {function} callback - function of the form function (error, users)
   */

  retrieveUsers: function (search, callback) {
    var db = database.getDatabase();

    // delegate to db retrieve method
    db.retrieve('User', search, callback);
  },

  /**
   * retrieves a single user
   *
   * @param {object} search - fields to match: should use 'email' which is unique
   * @param {function} callback - function of the form function (error, user)
   */

  retrieveUser: function (search, callback) {
    var db = database.getDatabase();

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
  },

  /**
   * updates a single user
   *
   * @param {object} search - fields to match: should use 'email' which is unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, user)
   */

  updateUser: function (search, update, callback) {
    var db = database.getDatabase();

    // only execute if we have a single matching record
    this.retrieveUser(search, function (error, result) {
      if (error) {
        callback(error);
      } else if (result) {
        db.update('User', search, update, callback);
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
    var db = database.getDatabase();

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
    var db = database.getDatabase();

    // confirm the user exists and is there is only one of them
    this.retrieveUser(user, function (error, result) {
      if (error) {
        callback(error);
      } else if (result) {
        db.destroy('User', user, callback);
      } else {
        callback(new Error('No matching user record found'));
      }
    });
  },

  /**
   * Used with sessions to serialize user data
   *
   * @param {object} data - the user to serialize
   * @param {callback} cb
   */

  serializeUser: function (data, cb) {
    // only serialize the _id and tenant vars
    cb(null, { _id: data._id, tenant: data.tenant });
  },

  /**
   * Used with sessions to retrieve a user based on serialized data
   *
   * @param {object} data - the user to restore
   * @param {callback} cb
   */

  deserializeUser: function (data, cb) {
    this.retrieveUser( { _id: data._id }, function (error, rec) {
      cb(error, rec);
    });
  }

};


