// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Space for tenant plugin
 */

var origin = require('../../../'),
  Constants = require('../../../lib/outputmanager').Constants,
  configuration = require('../../../lib/configuration'),
  database = require('../../../lib/database'),
  util = require('util'),
  path = require('path'),
  fs = require('fs'),
  async = require('async'),
  _ = require('underscore'),
  logger = require('../../../lib/logger');

var du = require('du');
var bson = require('mongoose/node_modules/bson');
var BSON = new bson.BSONPure.BSON();

function SpaceTenant() {}

SpaceTenant.prototype.calculate = function(tenantId, request, response, next) {
  next = Object.prototype.toString.call(next) === '[object Function]' ? next : function() {};

  async.waterfall([
    function getTenant(callback) {
      getFromDatabase('tenant', { _id: tenantId }, { jsonOnly: true }, function(error, results) {
        if (error) {
          return callback(error);
        }

        callback(null, results[0]);
      });
    },
    function calculateSpace(tenant, callback) {
      async.parallel([
        async.apply(getFileSystemSizeForTenant, tenantId, tenant),
        async.apply(getDatabaseSizeForTenant, tenant)
      ], function(err, results) {
        if (err) {
          return callback(err);
        }

        var diskSize = results[0];
        var databaseSize = results[1];

        callback(null, diskSize, databaseSize);
      });
    },
    function finalize(diskSize, databaseSize, callback) {
      callback(null, { tenant: tenantId, totalSize: (diskSize + databaseSize), diskSize: diskSize, databaseSize: databaseSize });
    }
  ], next);

};

function getFromDatabase(model, args, options, callback) {
  var self = this;
  database.getDatabase(function(error, db) {
    if (error) {
      return callback(error);
    }

    db.retrieve(model, args, options, function(error, results) {
      if (error) {
        return callback(error);
      }
      if (!results) {
        return callback(new Error('Unexpected results returned for ' + model + ' (' + results.length + ')', self));
      }

      callback(null, results);
    });
  });
}

function getFileSystemSizeForTenant(tenantId, tenant, callback) {
  var tenantFrameworkDir = path.join(configuration.tempDir, tenantId, Constants.Folders.Framework);
  var tenantDataDir = path.join(configuration.serverRoot, configuration.conf.dataRoot, tenant.name);

  async.parallel([
    async.apply(calculateDirectorySize, tenantFrameworkDir),
    async.apply(calculateDirectorySize, tenantDataDir)
  ], function(error, results) {
    if (error) {
      return callback(error);
    }

    var totalSize = results[0] + results[1];
    callback(null, totalSize);
  });

}

function getDatabaseSizeForTenant(tenant, callback) {
  var totalSize = 0;

  function calculateTotal(document, cb) {
    calculateMongoDBDocumentSize(document, function(error, size) {
      if (error) {
        return cb(error);
      }

      totalSize += size;
      cb();
    });
  }

  async.waterfall([
    async.apply(calculateTotal, tenant),
    async.apply(getFromDatabase, 'course', { _tenantId: tenant._id }, { jsonOnly: true }),
    function calculateForTenantCourses(courses, cb) {
      async.each(courses, function(course, cb1) {
        async.each([
          'config',
          'contentobject',
          'article',
          'block',
          'component'
        ], function(item, cb2) {
          async.waterfall([
            async.apply(getFromDatabase, item, { _courseId: course._id }, { jsonOnly: true }),
            calculateTotal
          ], cb2);
        }, cb1);
      }, cb);
    }
  ], function(error) {
    if (error) {
      return callback(error);
    }

    callback(null, totalSize);
  });

}

function calculateMongoDBDocumentSize(document, callback) {
  var size = BSON.calculateObjectSize(document);
  callback(null, size);
}

function calculateDirectorySize(directory, callback) {
  fs.exists(directory, function(exists) {
    if (!exists) {
      return callback(null, 0);
    }

    du(directory, callback);
  });
}

/**
 * Module exports
 *
 */

exports = module.exports = SpaceTenant;
