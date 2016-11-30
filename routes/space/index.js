var server = module.exports = require('express')();
var logger = require('../../lib/logger');
var permissions = require('../../lib/permissions');
var pluginmanager = require('../../lib/pluginmanager');
var usermanager = require('../../lib/usermanager');
var tenantmanager = require('../../lib/tenantmanager');
var database = require('../../lib/database');
var util = require('util');
var async = require('async');

function SpacePermissionError(message, httpCode) {
  this.message = message || 'Permission denied';
  this.http_code = httpCode || 401;
}
util.inherits(SpacePermissionError, Error);

// stop any auto permissions checks
permissions.ignoreRoute(/^\/space\/?.*$/);

server.get('/space', function(req, res, next) {
  var search = req.query;
  tenantmanager.retrieveTenants(search, function(error, tenants) {
    if (error) {
      return next(new Error('Unable to fetch tenants'));
    }
    getTenantSpaceArray(req, res, tenants, function(spaceArray) {
      if (spaceArray) {
        spaceArray.success = true;
        res.statusCode = 200;
        return res.json(spaceArray);
      }
    });
  });
});



server.get('/space/:tenant', function(req, res, next) {
  var tenantId = req.params.tenant;
  var result;
  //In case of error response is send from tenantSpaceDetails function
  tenantSpaceDetails(req, res, tenantId, function(result) {
    if (result) {
      result.success = true;
      res.statusCode = 200;
      return res.json(result);
    }
  });

});

function getTenantSpaceArray(req, res, tenants, callback){
  var spaceArray = [];
    for (var tenant in tenants) {
      var currentTenant = tenants[tenant];
      var tenantId = currentTenant._id.toString();
      tenantSpaceDetails(req, res, tenantId, function(spaceDetails) {
          spaceArray.push(spaceDetails);

          if(spaceArray.length === tenants.length){
            callback(spaceArray)
          }
      });
    }
}

function tenantSpaceDetails(req, res, tenantId, next) {
  var tenant = tenantId;

  var type = 'tenant';
  var currentUser = usermanager.getCurrentUser();
  if (!currentUser || (tenant !== currentUser.tenant._id)) {
    // return next(new SpacePermissionError());
  }

  async.waterfall([
    function getPluginInfoFromManager(cb) {
      pluginmanager.getManager().getPlugin('space', type, function(error, pluginInfo) {
        if (error) {
          return cb(new Error('space type plugin ' + type + ' was not found'));
        }

        cb(null, pluginInfo);
      });
    },
    function initiatePlugin(pluginInfo, cb) {
      try {
        var SpacePlugin = require(pluginInfo.fullPath);
        cb(null, new SpacePlugin());
      } catch (err) {
        return cb(err);
      }
    },
    function calculateSpace(plugin, cb) {
      plugin.calculate(tenant, req, res, cb);
    }
  ], function(error, result) {
    if (error) {
      logger.log('error', error);
      res.statusCode = 500;
      return res.json({
        success: false,
        message: error.message
      });
    }

    next(result);
    //result.success = true;
    //console.log(result);
    // res.statusCode = 200;
    // return res.json(result);
  });
}
