// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Role management module
 */
var async = require('async');
var fs = require('fs');
var path = require('path');
var util = require('util');

var configuration = require('./configuration');
var database = require('./database');
var frameworkhelper = require('./frameworkhelper');
var logger = require('./logger');
var permissions = require('./permissions');
var rest = require('./rest');

// custom errors
function RoleCreateError (message) {
  this.name = 'RoleCreateError';
  this.message = message || 'Role create error';
}

util.inherits(RoleCreateError, Error);

var RoleManager = {

  RoleNames: {
    Admin: "Super Admin",
    AuthenticatedUser: "Authenticated User",
    CourseCreator: "Course Creator"
  },
  
  // expose errors
  errors: {
    'RoleCreateError': RoleCreateError
  },

  /**
   * creates a role
   *
   * @param {object} role - a fully defined role object
   * @param {function} callback - function of the form function (error, role)
   */
  createRole: function (role, callback) {
    var self = this;

    database.getDatabase(function (err, db) {
      // verify the role name does not already exist
      db.retrieve('role', { name: role.name }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length) {
          // role exists
          return callback(new RoleCreateError('A role with that name already exists!'));
        }

        db.create('role', role, function (error, result) {
          // wrap the callback since we might want to alter the result
          if (error) {
            logger.log('error', 'Failed to create role: ', role);
            return callback(error);
          }

          return callback(null, result);
        });
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves roles matching the search
   *
   * @param {object} search - fields of role that should be matched
   * @param {object} options - operators, populators etc
   * @param {function} callback - function of the form function (error, roles)
   */

  retrieveRoles: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    database.getDatabase(function (err, db) {
      // delegate to db retrieve method
      db.retrieve('role', search, options, callback);
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single role
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} options - query, operators etc
   * @param {function} callback - function of the form function (error, role)
   */

  retrieveRole: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    database.getDatabase(function(err, db) {
      db.retrieve('role', search, options, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length === 1) {
            // ideally, we only get a single result
            return callback(null, results[0]);
        }

        // allow duplicates, but log a warning
        logger.log('warn', 'duplicate roles found for search!', search);
        return callback(null, results[0]);
      });
     }, configuration.getConfig('dbName'));
  },

  /**
   * updates a single role
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, role)
   */

  updateRole: function (search, update, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // only execute if we have a single matching record
      self.retrieveRole(search, function (error, result) {
        if (error) {
          return callback(error);
        }

        if (result) {
          return db.update('role', search, update, callback);
        }

        return callback(new Error('No matching role record found'));
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * delete a role (should this also remove role assignments?)
   *
   * @param {string} roleId - must match a role in db
   * @param {function} callback - function of the form function (error)
   */

  destroyRole: function (roleId, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the role exists and is there is only one of them
      self.retrieveRole({ _id: roleId }, function (error, result) {
        if (error) {
          return callback(error);
        }
        if (!result) {
          return callback(new Error('No matching role record found'));
        }
        return db.destroy('role', { _id: result._id }, callback);
      });
    }, configuration.getConfig('dbName'));
  },
  
  /**
   * assigns a given role to a given user
   *
   * @param {objectid} roleId - the role to assign
   * @param {objectid} userId - the user
   * @param {callback} next
   */

  assignRole: function (roleId, userId, next) {
    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }

      // first, retrieve the role
      app.rolemanager.retrieveRole({ _id: roleId }, function (err, role) {
        if (err) {
          return next(err);
        }

        if (!role) {
          return next(new Error('Role not found!'));
        }

        // update the users role
        db.retrieve('user', { _id: userId }, { fields: 'roles' }, function (err, records) {
          if (err) {
            return next(err);
          }

          if (1 !== records.length) {
            return next(new Error('Unable to locate user record'));
          }

          var roles = records[0].roles || [];
          // if the user has the role already, consider this a successful operation
          if (-1 !== roles.indexOf(roleId)) {
            return next(null, records[0]);
          }

          // otherwise, push the role assignment
          roles.push(roleId);
          db.update('user', { _id: userId }, { 'roles': roles }, next);
        });
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * Assigns a named role to a given user
   *
   * @param {string} roleName - the name of the role to assign
   * @param {objectid} userId - unique identifier for the user
   * @param {callback} next
   */
  assignRoleByName: function (roleName, userId, next) {
    // first, attempt to fetch role
    app.rolemanager.retrieveRole({ name: roleName }, function (err, role) {
      if (err) {
        return next(err);
      }

      if (!role) {
        return next(new Error('Failed to find a role with the name ' + roleName));
      }

      return app.rolemanager.assignRole(role._id, userId, next);
    });
  },

  /**
   * Assigns Authenticated User and Course Creator roles to a given user
   * 
   * @param {objectId} userId - Unique identifier of the user
   * @param {callback} next
   */
  assignDefaultRoles: function(userId, next) {
    var self = this;
    var defaultRoles = [
      self.RoleNames.AuthenticatedUser, 
      self.RoleNames.CourseCreator
    ];
    
    // Note: this must be called in series otherwise the 'user'
    // document will refer to a different version.
    async.eachSeries(defaultRoles, function(roleName, callback) {
      self.assignRoleByName(roleName, userId, function(err) {
        if (err) {
          return callback(err);
        }
        
        return callback(null);
      });  
    }, function(err) {
      if (err) {
        logger.log('error', err);
        return next(err);
      }
      
      return next(null);
    });  
  },
  
  /**
   * unassigns a given role from a given user
   *
   * @param {objectid} roleId - the role to unassign
   * @param {objectid} userId - the user
   * @param {callback} next
   */
  unassignRole: function (roleId, userId, next) {
    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }
      // update the users role
      db.retrieve('user', { _id: userId }, { fields: 'roles' }, function (err, records) {
        if (err) {
          return next(err);
        }

        if (1 !== records.length) {
          return next(new Error('Unable to locate user record'));
        }

        var roles = records[0].roles || [];
        roles.splice(roles.indexOf(roleId), 1);
        db.update('user', { _id: userId }, { 'roles': roles }, function (err) {
          if (err) {
            return next(err);
          }

          return next(null);
        });
      });
    }, configuration.getConfig('dbName'));
  },
  
  // see below for implementation
  installDefaultRoles: installDefaultRoles,
  syncDefaultRoles: syncDefaultRoles,

  /**
   * init function
   *
   */

  init: function (app) {
    // expose this module
    app.rolemanager = this;
    app.on('tenant:mastercreated', installDefaultRoles);
    app.on('create:masterdatabase', syncDefaultRoles);

    // assign a role to a user
    rest.post('/role/:id/assign/:userid', function (req, res, next) {
      var userId = req.params.userid;
      var roleId = req.params.id;
      app.rolemanager.assignRole(roleId, userId, function (err) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json({ success: true, message: 'Role assigned successfully' });
      });
    });

    // unassign a role from a user
    rest.post('/role/:id/unassign/:userid', function (req, res, next) {
      var userId = req.params.userid;
      var roleId = req.params.id;
      app.rolemanager.unassignRole(roleId, userId, function (err) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json({ success: true, message: 'successfully removed role' });
      });
    });

    // create role
    rest.post('/role', function (req, res, next) {
      var roleData = req.body;

      app.rolemanager.createRole(roleData, function (err, result) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json(result);
      });
    });

    // enumerate roles
    rest.get('/role', function (req, res, next) {
      var search = req.query;
      var options = req.query.operators || {};

      app.rolemanager.retrieveRoles(search, options, function (err, results) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json(results);
      });
    });

    // single role
    rest.get('/role/:id', function (req, res, next) {
      var id = req.params.id;
      var options = req.query.operators || {};

      if ('string' !== typeof id) {
        res.statusCode = 400;
        return res.json({ success: false, message: 'id param must be an objectid' });
      }

      app.rolemanager.retrieveRole({ _id: id }, options, function (err, roleRec) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json(roleRec);
      });
    });

    // update a single role
    rest.put('/role/:id', function (req, res, next) {
      var id = req.params.id;
      var delta = req.body;

      if ('string' !== typeof id) {
        res.statusCode = 400;
        return res.json({ success: false, message: 'id param must be an objectid' });
      }

      app.rolemanager.updateRole({ _id: id }, delta, function (err, result) {
        if (err) {
          return next(err);
        }

        // update was successful
        res.statusCode = 200;
        return res.json(result);
      });
    });

    // delete a role
    rest.delete('/role/:id', function (req, res, next) {
      var id = req.params.id;

      if ('string' !== typeof id) {
        res.statusCode = 400;
        return res.json({ success: false, message: 'id param must be an objectid' });
      }

      app.rolemanager.destroyRole(id, function (err) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json({ success: true, message: 'successfully deleted role!' });
      });
    });
  }
};

/**
 * adds default roles to a tenant from ./lib/role/*.json files
 *
 * @param {object} options - not currently used
 * @param {callback} cb - callback function
 */

function installDefaultRoles (options, cb) {
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }
  
  database.getDatabase(function (err, db) {
    if (err) {
      return cb(err);
    }

    // read roles from disk
    fs.readdir(path.join(configuration.serverRoot, 'lib', 'role'), function (err, files) {
      async.each(
        files,
        function (file, next) {
          if ('.json' !== path.extname(file)) {
            // ignore this file
            return next();
          }

          var roledef = false;
          try {
            roledef = require(path.join(configuration.serverRoot, 'lib', 'role', file));
          } catch (error) {
            return next(error);
          }

          // add to db - NB: we don't use the createRole method, since
          // this is being added to an arbitrary tenant.
          db.create('role', roledef, function (err, rec) {
            if (err) {
              // log error, but continue
              logger.log('warn', 'failed to add role to tenant: ' + roledef.name, err);
            }
            return next(err);
          });
        },
        function (err) {
          // logging of errors already handled
          if ('function' === typeof cb) {
            return cb(err);
          }
        }
      );
    });

  }, configuration.getConfig('dbName'));
}

function syncDefaultRoles (options, next) {
  if ('function' === typeof options) {
    next = options;
    options = {};
  }
  
  database.getDatabase(function (err, db) {
    if (err) {
      return next(err);
    }

    // read roles from disk
    fs.readdir(path.join(configuration.serverRoot, 'lib', 'role'), function (err, files) {
      async.each(
        files,
        function (file, callback) {
          if ('.json' !== path.extname(file)) {
            // ignore this file
            return callback();
          }

          var role = false;
          try {
            role = require(path.join(configuration.serverRoot, 'lib', 'role', file));
          } catch (error) {
            return callback(error);
          }

          // Apply the latest version of the roles to the master tenant
          db.update('role', { name: role.name }, { version: role.version, statement: role.statement }, function (err, rec) {
            if (err) {
              logger.log('warn', '- ' + role.name + ' update failed', err);
            }
            if (!rec) {
              logger.log('warn', '- ' + role.name + ' doesn\'t exist, cannot update', err);
            }
            return callback(err);
          });
        },
        function (err) {
          if ('function' === typeof next) {
            return next(err);
          }
        }
      );
    });

  }, configuration.getConfig('dbName'));
}

exports = module.exports = RoleManager;
