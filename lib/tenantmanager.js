/**
 * Tenant management module
 */

var util = require('util'),
    database = require('./database'),
    logger = require('./logger'),
    fs = require('fs'),
    path = require('path'),
    ncp = require('ncp'),
    mkdirp = require('mkdirp'),
    frameworkhelper = require('./frameworkhelper'),
    configuration = require('./configuration');

// Constants
var FRAMEWORK_DIR = 'adapt_framework',
  TEMP_DIR = path.join(configuration.serverRoot, 'temp');

// custom errors
function TenantCreateError (message) {
  this.name = 'TenantCreateError';
  this.message = message || 'Tenant create error';
}

util.inherits(TenantCreateError, Error);

function DuplicateTenantError (message) {
  this.name = 'DuplicateTenantError';
  this.message = message || 'Tenant already exists';
}

util.inherits(DuplicateTenantError, Error);

exports = module.exports = {

  // expose errors
  errors: {
    'TenantCreateError': TenantCreateError,
    'DuplicateTenantError': DuplicateTenantError
  },

  /**
   * Creates the working folders required by a new tenant to preview
   * or publish courses
   * @param {object} tenant - a fully defined tenant object
   * @param {function} callback - function of the form function (error, tenant)
   */
  createTenantFilesystem: function(tenant, callback) {

    function copyFramework(callback) {
      logger.log('info', 'Copying Adapt framework into place for new tenant');
      ncp(path.join(configuration.serverRoot, FRAMEWORK_DIR), path.join(TEMP_DIR, tenant._id.toString(), FRAMEWORK_DIR), function (err) {
        if (err) {
          logger.log('error', err);
          return callback(err);
        } else {
          return callback(null);
        }
      });
    };

    mkdirp(path.join(TEMP_DIR, tenant._id.toString()), function (err) {
        if (err) {
          logger.log('error', err);
          return callback(err);
        }

        // Check that framework exists
        fs.exists(path.join(configuration.serverRoot, FRAMEWORK_DIR), function(exists) {
          if (!exists) {
            logger.log('info', 'Framework does not exist');
            frameworkhelper.cloneFramework(null, function(err, result) {
              if (err) {
                logger.log('fatal', 'Error cloning framework', err);
                return callback(err);
              }
              else {
                return copyFramework(callback)
              }
            });
          } else {
            return copyFramework(callback);
          }
        });
      });
  },

  /**
   * creates a tenant
   *
   * @param {object} tenant - a fully defined tenant object
   * @param {function} callback - function of the form function (error, tenant)
   */
  createTenant: function (tenant, callback) {
    var self = this;

    database.getDatabase(function(err, db){

      // name is our primary unique identifier
      if (!tenant.name || 'string' !== typeof tenant.name) {
        return callback(new TenantCreateError('tenant name is required!'));
      }

      // create db details if not supplied
      if (!tenant.database) {
        tenant.database = {
          dbName: configuration.getConfig('tenantPrefix') + tenant.name,
          dbHost: configuration.getConfig('dbHost'),
          dbUser: configuration.getConfig('dbUser'),
          dbPass: configuration.getConfig('dbPass'),
          dbPort: configuration.getConfig('dbPort')
        };
      }

      // verify the tenant name
      db.retrieve('tenant', { name: tenant.name }, function (error, results) {
        if (error) {
          callback(error);
        } else if (results && results.length) {
          // tenant exists
          callback(new DuplicateTenantError());
        } else {
          db.create('tenant', tenant, function (error, result) {
            // wrap the callback since we might want to alter the result
            if (error) {
              logger.log('error', 'Failed to create tenant: ', tenant);
              callback(error);
            } else {
              self.createTenantFilesystem(result, function(error) {
                if (error) {
                  callback(error);
                } else {
                  callback(null, result);
                }
              });
            }
          });
        }
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves tenants matching the search
   *
   * @param {object} search - fields of tenant that should be matched
   * @param {function} callback - function of the form function (error, tenants)
   */

  retrieveTenants: function (search, callback) {
    database.getDatabase(function(err, db){
      // delegate to db retrieve method
      db.retrieve('tenant', search, callback);
    });
  },

  /**
   * retrieves a single tenant
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {function} callback - function of the form function (error, tenant)
   */

  retrieveTenant: function (search, callback) {
     database.getDatabase(function(err, db){
      db.retrieve('tenant', search, function (error, results) {
        if (error) {
          callback(error);
        } else if (results && results.length > 0) {
          if (results.length === 1) {
            // we only want to retrieve a single tenant, so we send an error if we get multiples
            callback(null, results[0]);
          } else {
            callback(new Error('tenant search expected a single result but returned ' + results.length + ' results'));
          }
        } else {
          callback(null, false);
        }
      });
     }, configuration.getConfig('dbName'));
  },

  /**
   * updates a single tenant
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, tenant)
   */

  updateTenant: function (search, update, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // only execute if we have a single matching record
      self.retrieveTenant(search, function (error, result) {
        if (error) {
          callback(error);
        } else if (result) {
          db.update('tenant', search, update, callback);
        } else {
          callback(new Error('No matching tenant record found'));
        }
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * sets the 'active' state of a single tenant. We don't hard delete tenants.
   *
   * @param {object} tenant - must match the tenant in db
   * @param {boolean} active - the active state, true or false
   * @param {function} callback - function of the form function (error)
   */

  setTenantActive: function (tenant, active, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the tenant exists and is there is only one of them
      self.retrieveTenant(tenant, function (error, result) {
        if (error) {
          callback(error);
        } else if (result) {
          this.updateTenant({ '_id': result._id }, { 'active': active }, callback);
        } else {
          callback(new Error('No matching tenant record found'));
        }
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * deletes a single tenant - usually we don't want to delete a tenant, only
   * set it to inactive
   *
   * @param {object} tenant - must match the tenant in db
   * @param {function} callback - function of the form function (error)
   */

  deleteTenant: function (tenant, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the tenant exists and is there is only one of them
      self.retrieveTenant(tenant, function (error, result) {
        if (error) {
          callback(error);
        } else if (result) {
          db.destroy('tenant', tenant, callback);
        } else {
          callback(new Error('No matching tenant record found'));
        }
      });
    }, configuration.getConfig('dbName'));
  }
};


