// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Tenant management module
 */
var async = require('async');
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var ncp = require('ncp');
var path = require('path');
var util = require('util');

var configuration = require('./configuration');
var database = require('./database');
var installHelpers = require('./installHelpers');
var logger = require('./logger');

// Constants
var MODNAME = 'tenantmanager';
var WAITFOR = 'database';
var FRAMEWORK_DIR = 'adapt_framework';
var CREATE_TENANT_WHITELIST = ['name', 'displayName', 'isMaster'];

// custom errors
function TenantCreateError (message) {
  this.name = 'TenantCreateError';
  this.message = message || 'Tenant create error';
}

util.inherits(TenantCreateError, Error);

function DuplicateTenantError (message) {
  this.name = 'TenantDuplicateError';
  this.message = message || 'Duplicate tenant error';
}

util.inherits(DuplicateTenantError, Error);

exports = module.exports = {

  // expose errors
  errors: {
    'TenantCreateError': TenantCreateError,
    'DuplicateTenantError': DuplicateTenantError
  },

  /**
   * preload function sets up event listener for startup events
   *
   * @param {object} app - the Origin instance
   * @return {object} preloader - a ModulePreloader
   */

  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events:this.preloadHandle(app,this) });
    return preloader;
  },

  /**
   * Event handler for preload events
   *
   * @param {object} app - Server instance
   * @param {object} instance - Instance of this module
   * @return {object} hash map of events and handlers
   */

  preloadHandle : function (app, instance) {
    return {

      preload : function () {
        var preloader = this;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
      },

      moduleLoaded : function (modloaded) {
        var preloader = this;

        // is the module that loaded this modules requirement
        if (modloaded === WAITFOR) {
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.LOADING);

          app.tenantmanager = instance;
          // set up routes
          var rest = require('./rest');
          var self = instance;

          // create tenant
          rest.post('/tenant', function (req, res, next) {
            var tenantData = req.body;

            self.createTenant(tenantData, function (err, result) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(result);
            });
          });

          // enumerate tenants
          rest.get('/tenant', function (req, res, next) {

            var search = req.query;
            var options = req.query.operators || {};

            self.retrieveTenants(search, options, function (err, results) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(results);
            });
          });

          // query tenants for lazy loading
          rest.get('/tenant/query', function(req, res, next) {


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

                /*options.populate = {
                  'roles' : 'name',
                  '_tenantId' : 'name'
                };*/

                self.retrieveTenants(query, options, function(err, users) {

                  if (err) {
                    return next(err);
                  }

                  // tenant was not found
                  if (!users) {
                    res.statusCode = 404;
                    return res.json({ success: false, message: 'tenants not found' });
                  }

                  res.statusCode = 200;
                  return res.json(users);
                });

            });


          });

          // single tenant
          rest.get('/tenant/:id', function (req, res, next) {
            var id = req.params.id;
            var options = req.query.operators || {};

            if (!id || 'string' !== typeof id) {
              res.statusCode = 400;
              return res.json({ success: false, message: 'id param must be an objectid' });
            }

            self.retrieveTenant({ _id: id }, options, function (err, tenantRec) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(tenantRec);
            });
          });

          // update a single tenant
          rest.put('/tenant/:id', function (req, res, next) {
            var id = req.params.id;
            var delta = req.body;

            self.updateTenant({ _id: id }, delta, function (err, result) {
              if (err) {
                return next(err);
              }

              // update was successful
              res.statusCode = 200;
              return res.json(result);
            });
          });

          // delete (softly) a tenant
          rest.delete('/tenant/:id', function (req, res, next) {
            var id = req.params.id;

            self.destroyTenant(id, function (err) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json({ success: true, message: 'successfully deleted tenant!' });
            });
          });

          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        }
      }
    };
  },

  /**
   * Creates the working folders required by a new tenant to preview
   * or publish courses
   * @param {object} tenant - a fully defined tenant object
   * @param {function} callback - function of the form function (error, tenant)
   */
  createTenantFilesystem: function(tenant, callback) {
    if (!tenant.isMaster) {
      logger.log('info', 'No filesystem required for tenant ' + tenant.name);
      callback(null);
    }
    logger.log('info', 'Creating master tenant filesystem');

    mkdirp(path.join(configuration.tempDir, tenant._id.toString()), function (err) {
      if (err) {
        logger.log('error', err);
        return callback(err);
      }
      var tenantFrameworkDir = path.join(configuration.tempDir, tenant._id.toString(), FRAMEWORK_DIR);
      fs.exists(tenantFrameworkDir, function(exists) {
        if (exists) {
          return callback();
        }
        logger.log('info', 'Framework does not exist, will download');
        installHelpers.installFramework({
          repository: configuration.getConfig('frameworkRepository'),
          revision: configuration.getConfig('frameworkRevision'),
          directory: tenantFrameworkDir
        }, function(err, result) {
          if (err) {
            logger.log('error', `Error downloading the framework ${err}`);
          }
          callback(err);
        });
      });
    });
  },

  /**
   * creates a tenant
   *
   * @param {object} tenant - tenant details, only details on create tenant whitelist will be accepted
   * @param {function} callback - function of the form function (error, tenant)
   */
  createTenant: function (tenant, callback) {
    var self = this;

    // Strip out fields that are not on whitelist
    Object.keys(tenant).forEach(function(key) {
      if (!CREATE_TENANT_WHITELIST.includes(key)) {
        delete tenant[key];
      }
    });

    database.getDatabase(function(err, db){
      if (err) {
        logger.log('error', err);
        return callback(err);
      }

      // name is our primary unique identifier
      if (!tenant.name || 'string' !== typeof tenant.name) {
        return callback(new TenantCreateError('tenant name is required!'));
      }

      if (!tenant.displayName) {
        tenant.displayName = tenant.name;
      }

      // verify the tenant name
      db.retrieve('tenant', { name: tenant.name }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length) {
          // tenant exists
          return callback(new DuplicateTenantError());
        }

        if (!tenant.createdAt) {
          tenant.createdAt = new Date();
        }

        if (!tenant.updatedAt) {
          tenant.updatedAt = tenant.createdAt;
        }

        db.create('tenant', tenant, function (error, result) {
          // wrap the callback since we might want to alter the result
          if (error) {
            logger.log('error', 'Failed to create tenant: ', tenant);
            return callback(error);
          }

          // these are needed in createTenantFilesystem
          if(tenant.isMaster) {
            configuration.setConfig('masterTenantName', result.name);
            configuration.setConfig('masterTenantID', result._id.toString());
          }

          // create db details if not supplied
          if (!tenant.database) {
            tenant.database = {
              dbName: result._id,
              dbHost: configuration.getConfig('dbHost'),
              dbUser: configuration.getConfig('dbUser'),
              dbPass: configuration.getConfig('dbPass'),
              dbPort: configuration.getConfig('dbPort')
            };
          }

          // Verify that the database name is valid.
          if (tenant.database.dbName.length > 64) {
            return callback(new TenantCreateError('Database Name must be a maximum of 64 characters long'));
          }

          db.update('tenant', result, tenant, function(error, tenant) {
            if (error) {
              //Remove the partial tenant that was created already
              db.destroy('tenant', {_id: result._id}, function(error) {
                logger.log('error', 'Failed to create tenant: ', tenant);
                return callback(new TenantCreateError());
              });
            } else {

              self.createTenantFilesystem(result, function(error) {
                if (error) {
                  return callback(error);
                }

                // broadcast tenant creation event
                if (tenant.isMaster) {
                  app.emit('tenant:mastercreated', result);
                }

                return callback(null, result);
              });
            }
          });
        });
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves tenants matching the search
   *
   * @param {object} search - fields of tenant that should be matched
   * @param {object} options - operators, populators etc
   * @param {function} callback - function of the form function (error, tenants)
   */

  retrieveTenants: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    database.getDatabase(function(err, db){
      if (err) {
          logger.log('error', err);
          return callback(err);
      }

      // delegate to db retrieve method
      db.retrieve('tenant', search, options, callback);
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single tenant
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} options - query, operators etc
   * @param {function} callback - function of the form function (error, tenant)
   */

  retrieveTenant: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    database.getDatabase(function(err, db) {
      if (err) {
        logger.log('error', err);
        return callback(err);
      }

      db.retrieve('tenant', search, options, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length === 1) {
            // we only want to retrieve a single tenant, so we send an error if we get multiples
            return callback(null, results[0]);
        }

        return callback(null, false);
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
      if (err) {
        logger.log('error', err);
        return callback(err);
      }

      // only execute if we have a single matching record
      self.retrieveTenant(search, function (error, tenantRec) {
        if (error) {
          return callback(error);
        }

        if (tenantRec) {
          if (!update.updatedAt) {
            update.updatedAt = new Date();
          }

          db.update('tenant', search, update, function(error) {
            if (error) {
              return callback(error);
            }

            // Re-fetch the tenant
            self.retrieveTenant(search, function(error, tenantRec) {
              if (error) {
                return callback(error);
              }

              return callback(null, tenantRec);
            });

          });
        } else {
          return callback(new Error('No matching tenant record found'));
        }

      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * delete a tenant (soft delete, just updates the deleted flag)
   *
   * @param {string} tenantId - must match a tenant in db
   * @param {function} callback - function of the form function (error)
   */

  destroyTenant: function (tenantId, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      if (err) {
        logger.log('error', err);
        return callback(err);
      }
      // confirm the tenant exists
      self.retrieveTenant({ _id: tenantId }, function (error, tenantRec) {
        if (error) {
          return callback(error);
        }
        if (!tenantRec) {
          return callback(new Error('No matching tenant record found'));
        }
        return db.destroy('tenant',{_id:tenantId},callback);
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
    database.getDatabase(function(err, db) {
      if (err) {
        logger.log('error', err);
        return callback(err);
      }
      // confirm the tenant exists
      self.retrieveTenant(tenant, function (error, tenantRec) {
        if (error) {
          return callback(error);
        }
        if (!tenantRec) {
          return callback(new Error('No matching tenant record found'));
        }
        async.parallel([
          function cleanDB(done) {
            db.destroy('tenant', tenant, done);
          },
          function removeTemp(done) {
            self.deleteTenantFilesystem(tenantRec, done);
          }
        ], callback);
      });
    }, configuration.getConfig('dbName'));
  },

  /**
  * Removes the tenant's working folders
  * @param {object} tenant - a fully defined tenant object
  * @param {function} callback - function of the form function (error)
  */
  deleteTenantFilesystem: function(tenant, callback) {
    fs.remove(path.join(configuration.tempDir, tenant._id.toString()), callback);
  },

  /**
   * returns the database object for a named tenant
   *
   * @param {string} tenantId
   * @param {callback} next
   */
  getDatabaseConfig: function (tenantId, next) {
    // just fetch up the tenant from the master db
    this.retrieveTenant({ _id: tenantId }, function (err, tenantRec) {
      if (err) {
        return next(err);
      }

      if (!tenant) {
        return next(new Error('Tenant not found'));
      }

      // if database is not defined, the caller is expected to deal with item
      return next(null, tenantRec.database);
    });
  }
};
