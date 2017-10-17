// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Module depencies
 */

var path = require('path'),
    fs = require('fs'),
    logger = require('./logger'),
    configuration = require('./configuration'),
    tenantmanager = require('./tenantmanager'),
    EventEmitter = require('events').EventEmitter,
    async = require('async'),
    util = require('util');

/*
 * CONSTANTS
 */
var MODNAME = 'database',
    WAITFOR = 'configuration';

var errors = {
  'notthere': function(dbfile){
    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor); //super helper method to include stack trace in error object

    this.name = 'DatabaseNotAvailable';
    this.message = 'Database file unvailable at (' + dbfile + ')';
  },
  'nocallback':function(fnName){
    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor); //super helper method to include stack trace in error object

    this.name = 'DatabaseFunctionCalledWithoutCallback';
    this.message = 'Database function was called without being provided a callback :: ' + fnName;
  }
};

Object.keys(errors).forEach(function(fnName){
  util.inherits(errors[fnName], Error);
});

// memoizes database instances
var _databases = Object.create(null);

// private hooks - only allow hooks defined here
var _dbHooks = Object.create(null);
_dbHooks['create'] = [];


/**
 * @api private
 */
function getDriverPath () {
  return path.join(configuration.serverRoot, 'lib', 'dml');
}

/**
 * @api private
 */
function getSchemaPath () {
  return path.join(getDriverPath(), 'schema');
}


/**
 *
 * @constructor
 */

function Database() {
}

util.inherits(Database, EventEmitter);

/**
 * starts the database connection
 *
 * @abstract
 */
Database.prototype.connect = function () {
  logger.log('warn', 'Database.connect must be implemented by extending object!');
  throw new Error('Database.connect must be implemented by extending object!');
};

/**
 * closes the database connection
 *
 * @param {callback} next
 * @abstract
 */
Database.prototype.disconnect = function (next) {
  logger.log('warn', 'Database.disconnect must be implemented by extending object!');
  throw new Error('Database.disconnect must be implemented by extending object!');
};

/**
 * should check if this database instance is up to date with the passed tenant
 *
 * @abstract
 */
Database.prototype.isStale = function (tenant) {
  logger.log('warn', 'Database.isStale must be implemented by extending object!');
  throw new Error('Database.isStale must be implemented by extending object!');
};

Database.prototype.isValidIdentifier = function (id) {
  logger.log('warn', 'Database.isValidIdentifier must be implemented by extending object!');
  throw new Error('Database.isValidIdentifier must be implemented by extending object!');
};

/**
 * loads any schemas from the specified location
 *
 * @abstract
 * @param {string} schemaDirectory - the directory from which to load schemas
 * @param {function} callback - Callback function to be called once all schemas are loaded
 */
Database.prototype.loadSchemas = function (schemaDirectory, callback) {
  logger.log('warn', 'Database.loadSchemas must be implemented by extending object!');
  throw new Error('Database.loadSchemas must be implemented by extending object!');
};

/**
 * add a new database model from json schema uses Database#importSchema
 *
 * @param {string} modelName - case insensitive
 * @param {object} schema - json object
 * @param {callback} [next] - utility callback
 */

Database.prototype.addModel = function (modelName, schema, next) {
  if ('function' !== typeof next) {
    next = function (err, schema) { /* does nothing */ }
  }

  // uri is required to handle errors with self referencing schema
  var uri = 'http://localhost/system/' + modelName + '.schema';
  var self = this;
  self.importSchema(uri, schema, function (err, importedSchema) {
    if (err) {
      return next(err);
    }

    // all models use lowercase
    self.addSchema(modelName, importedSchema);
    next(null, importedSchema);
  });
};

/**
 * adds the schema output from a schema import to the db
 *
 * @param {string} modelName
 * @param {object} orm
 */

Database.prototype.addSchema = function (modelName, schema) {
  logger.log('warn', 'Database#addSchema must be implemented by extending object!');
  throw new Error('Database#addSchema must be implemented by extending object!');
};

/**
 * retrieves a model from the known model collection
 *
 * @param {string} modelName - the name of the model to retrieve
 * @return {object} model
 */

Database.prototype.getModel = function (modelName) {
  logger.log('warn', 'Database#getModel must be implemented by extending object!');
  throw new Error('Database#getModel must be implemented by extending object!');
};

/**
 * retrieves all models from the model collection
 *
 * @param {string} modelName - the name of the model to retrieve
 * @return {object} model
 */

Database.prototype.getModelNames = function () {
  logger.log('warn', 'Database#getModelNames must be implemented by extending object!');
  throw new Error('Database#getModelNames must be implemented by extending object!');
};

/**
 * generate a populator object from passed options
 *
 * @param {object} options
 * @return {object} populate object that can be passed to Database#retrieve
 */
Database.prototype.buildPopulator = function (options) {
  logger.log('warn', 'Database#buildPopulator must be implemented by extending object!');
  throw new Error('Database#buildPopulator must be implemented by extending object!');
};

/**
 * generate a query from an options object
 *
 * @param {object} options
 * @return {object} query object that can be passed to Database#retrieve
 */
Database.prototype.buildQuery = function (options) {
  logger.log('warn', 'Database#buildQuery must be implemented by extending object!');
  throw new Error('Database#buildQuery must be implemented by extending object!');
};

/**
 * creates a new object of specified type and inserts into the database
 *
 * @param {string} objectType - the type of object to create, e.g. 'user'
 * @param {object} objectData - the data that defines the object
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.create = function(objectType, objectData, callback) {
  logger.log('warn', 'Database#create must be implemented by extending object!');
  callback(new Error('Database#create not implemented'));
};

/**
 * retrieves an object or objects of specified type based on search params
 *
 * @param {string} objectType - the type of object to find, e.g. 'user'
 * @param {object} search
 * @param {object} [options]
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.retrieve = function(objectType, search, options, callback) {
  logger.log('warn', 'Database#retrieve must be implemented by extending object!');
  callback(new Error('Database#retrieve not implemented'));
};

/**
 * retrieves a single object of specified type based on search params
 *
 * @param {string} objectType - the type of object to find, e.g. 'user'
 * @param {object} search
 * @param {object} [options]
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.retrieveOne = function(objectType, search, options, callback) {
  logger.log('warn', 'Database#retrieve must be implemented by extending object!');
  callback(new Error('Database#retrieve not implemented'));
};

/**
 * updates an object of specified type with objectData
 *
 * @param {string} objectType - the type of object to update, e.g. 'user'
 * @param {object} conditions - update objects that match these conditions; should use uniqueid
 * @param {object} updateData - the data to update the object with
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.update = function(objectType, conditions, updateData, callback) {
  logger.log('warn', 'Database#update must be implemented by extending object!');
  callback(new Error('Database#update not implemented'));
};

/**
 * deletes an object of specified type identified by objectData
 *
 * @param {string} objectType - the type of object to delete, e.g. 'user'
 * @param {object} conditions - update objects that match these conditions; should use uniqueid
 * @param {function} callback - of the form function (error) ...
 */
Database.prototype.destroy = function(objectType, conditions, callback) {
  logger.log('warn', 'Database#destroy must be implemented by extending object!');
  callback(new Error('Database#destroy not implemented'));
};

/**
 * All database implmentations need to understand how to translate our schema
 *
 * @throws error if not implemented
 * @param {string} uri
 * @param {object} a schema to import
 * @param {callback} next
 */
Database.prototype.importSchema = function (uri, schema, next) {
  logger.log('warn', 'Database#importSchema must be implemented by extending object!');
  throw new Error('Database#importSchema not implemented');
};

/**
 * All database implmentations need to understand how to export our schema
 *
 * @throws error if not implemented
 * @param {object|array} results
 */
Database.prototype.exportResults = function (results, next) {
  logger.log('warn', 'Database#exportResults must be implemented by extending object!');
  throw new Error('Database#exportResults not implemented');
};

/**
 * resolves a schema path, returns an fs path for special cases
 *
 * @param {string} uri
 * @returns {string} local path if local, false
 */
function resolveSchemaPath (uri) {
  var local = "http://localhost/";
  var pathMap = {
    system: path.join(configuration.serverRoot, 'lib', 'dml', 'schema', 'system'),
    plugins: path.join(configuration.serverRoot, 'plugins')
  };

  if (uri.substr(0, local.length) === local) {
    // special case get from fs
    var localPath = uri.substr(local.length);
    var pathType = localPath.substr(0, localPath.indexOf('/'));
    if ('string' === typeof pathMap[pathType]) {
      return path.join(pathMap[pathType], localPath.substr(pathType.length).replace(/\//g, path.sep));
    }
  }

  // could not resolve
  logger.log('info', 'could not resolve uri to local path: ' + uri);
  return false;
}

/**
 * allows addition of callbacks for varions database hooks
 * 
 * @param {string} eventType - type of the event to hook
 * @param {callback} 
 */

function addDatabaseHook (eventType, callback) {
  if (_dbHooks[eventType]) {
    _dbHooks[eventType].push(callback);
  }
}

/**
 * processes hooks for a database instance
 *
 * @param {object} dbInstance - a database instance
 * @param {callback} next 
 */

function processDatabaseHooks (eventType, dbInstance, next) {
  if (!_dbHooks[eventType]) {
    return next(null);
  }

  async.eachSeries(
    _dbHooks[eventType],
    function (hook, cb) {
      hook(dbInstance, cb);
    },
    next
  );
}


/**
 * instantiates a database of the specified type using the tenant connection
 * details
 * 
 * @param {string} type - e.g. 'mongoose'
 * @param {object} tenant - a tenant record from DB
 * @param {callback} next
 */
function createDatabaseInstance (type, tenant, next) {
  var dbPath = path.join(getDriverPath(), type);
  var clsDB;
  
  try {
    clsDB = require(dbPath);  
  } catch (error) {
    logger.log('error', error);
    return next(new errors.notthere(dbPath));
  }
  
  var dbInstance = new clsDB();
  dbInstance.connect(tenant.database);
  logger.log('info', 'Connection established: ' + tenant.database.dbName);
  dbInstance.loadSchemas(path.join(getSchemaPath(), 'system'), function (error) {
    processDatabaseHooks('create', dbInstance, function (err) {
      if (err) {
        return next(err);
      }

      app.emit('create:database', dbInstance);
      return next(null, dbInstance);
    });
  });
}

/**
 * Creates a database instance if it does not exists, otherwise returns the current database instance
 *
 * @param {function} next - callback to be fired with the database object
 * @param {string} tenantId - (optional) specifies a tenant to use
 * @param {string} type - (optional) the type of database connector to use (e.g 'mongoose')
 */
function getDatabase(next, tenantId, type) {
  if (!_databases) {
    _databases = Object.create(null);
  }

  if ('function' !== typeof next) {
    logger.log('error', 'getDatabase called without callback function');
    throw new errors.nocallback('getDatabase');
  }

  var MASTER_DATABASE_NAME = configuration.getConfig('dbName');
  
  if ('string' !== typeof type) {
    type = configuration.getConfig('dbType');
  }

  if (!_databases[type]) {
    _databases[type]= Object.create(null);
  }

  if (!tenantId) {
    var user = app.usermanager.getCurrentUser();
    if (user.tenant) {
      tenantId = user.tenant._id;
    } else {
      return next(new Error("Failed to determine user's tenant!"));
    }
  }

  // The master tenant can be accessed by ID or name, so account for the fact
  // that the ID value may be passed.
  if (tenantId == MASTER_DATABASE_NAME || tenantId == configuration.getConfig('masterTenantID')) {
        
    if (_databases[type] && _databases[type][MASTER_DATABASE_NAME]) {
      return next(null, _databases[type][MASTER_DATABASE_NAME]);
    }

    // master tenant is read from config
    var masterTenant = {
      database: {
        'dbHost' : configuration.getConfig('dbHost'),
        'dbUser' : configuration.getConfig('dbUser'),
        'dbPass' : configuration.getConfig('dbPass'),
        'dbPort' : configuration.getConfig('dbPort'),
        'dbName' : MASTER_DATABASE_NAME
      }
    };

    return createDatabaseInstance(type, masterTenant, function (err, dbInstance) {
      if (err) {
        logger.log('error', err);
        return next(err);
      }

      if (!dbInstance) {
        return next(new Error('Failed to create master database'));
      }

      // Cache the instance in the _databases object.
      _databases[type][MASTER_DATABASE_NAME] = dbInstance;
      
      // Broadcast that connection to the master database has been established.
      app.emit('create:masterdatabase', dbInstance);
      
      return next(null, dbInstance);
    });
  }

  // need to fetch tenant info to ensure that db connection is not stale
  app.tenantmanager.retrieveTenant({ _id: tenantId }, function (err, tenant) {
    if (err) {
      logger.log('error', err);
      return next(err);
    }

    if (_databases[type] && _databases[type][tenantId]) {
      if (_databases[type][tenantId].isStale(tenant)) {
        // database config has changed, need to refetch
        _databases[type][tenantId].disconnect();
        delete _databases[type][tenantId];
      } else {
        return next(null, _databases[type][tenantId]);
      }
    }

    createDatabaseInstance(type, tenant, function (err, dbInstance) {
      if (err) {
        return next(err);
      }
      
      _databases[type][tenantId] = dbInstance;
      return next(null, dbInstance);
    });
  });
}

/**
 * Attempts to connect to the database, and returns an error on failure
 *
 * @param {callback} cb - function
 */
function checkConnection(cb) {
  var name = configuration.getConfig('dbName');
  var host = configuration.getConfig('dbHost');
  var port = configuration.getConfig('dbPort');
  if(!name || !host || !port) {
    return cb('Cannot check database connection, missing settings in config.json.');
  }
  getDatabase(function(error, db) {
    if(error) {
      return cb(error);
    }
    if(db.conn.readyState !== 1) {
      return cb(`Cannot connect to the MongoDB '${name}' at '${host}:${port}'. Please check the details are correct and the database is running.`);
    }
    cb();
  }, name);
}

/**
 * returns a list of available drivers
 *
 * @param {callback} cb - function that receives an array of driver names
 */
function getAvailableDrivers (cb) {
  fs.readdir(getDriverPath(), function (error, files) {
    if (error) {
      return cb(error);
    }

    var drivers = [];
    files.forEach(function (filename) {
      if ('schema' !== filename) {
        drivers.push(filename);
      }
    });

    return cb(null, drivers);
  });
}

/**
 * returns a list of available drivers
 *
 * @param {callback} cb - function that receives an array of driver names
 */
function getAvailableDriversSync () {
  files = fs.readdirSync(getDriverPath());
  var drivers = [];
  files.forEach(function (filename) {
    if ('schema' !== filename) {
      drivers.push(filename);
    }
  });
  
  return drivers;
}

/**
 * preload function sets up event listener for startup events
 *
 * @param {object} app - the Origin instance
 * @return {object} preloader - a ModulePreloader
 */
function preload(app) {

  var preloader = new app.ModulePreloader(app, MODNAME, {events:preloadHandle(app,this)});
  return preloader;
};

/**
 * Event handler for preload events
 *
 * @param {object} app Server instance
 * @param {object} instance Instance of this module
 */
function preloadHandle(app, instance){

  return {
    preload : function () {
      var preloader = this;
      preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
    },
    moduleLoaded : function (modloaded) {
      var preloader = this;
       //is the module that loaded this modules requirement
      if (modloaded === WAITFOR) {
        // only set app.db when configuration is available
        app.on('serverStarted', function (server) {
          instance.getDatabase(function (err, db) {
            if (err) {
              logger.log('error', 'failed to set app.db!', err);
              return false;
            }
            app.db = db;
          }, configuration.getConfig('dbName'));
        });

        // refresh db list on tenant update
        app.on('tenant:update', function (tenantId) {
          //instance.
        });


        // we proceed with minimal server
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
      }
    }
  };

};

/**
 * Module exports
 */
module.exports.addDatabaseHook = addDatabaseHook;
module.exports.getDatabase = getDatabase;
module.exports.checkConnection = checkConnection;
module.exports.resolveSchemaPath = resolveSchemaPath;
module.exports.getAvailableDrivers = getAvailableDrivers;
module.exports.getAvailableDriversSync = getAvailableDriversSync;
module.exports.Database = Database;
module.exports.preload = preload;
