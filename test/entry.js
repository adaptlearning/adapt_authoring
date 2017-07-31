var async = require('async');
var fs = require('fs-extra');
var path = require('path');

var origin = require('../');
var auth = require('../lib/auth');
var logger = require('../lib/logger');
var permissions = require('../lib/permissions');
var usermanager = require('../lib/usermanager');
var tenantmanager = require('../lib/tenantmanager');

var testData = require('./testData.json');

var app = origin();

before(function(done) {
  // this initialization appears to take a little longer
  this.timeout(600000);
  // only show warnings and errors
  logger.level('console','warn');
  // bootstrapping!
  app.use({ configFile: path.join('test', 'testConfig.json') });
  // add some test entities ...
  app.on('serverStarted', function(server) {
    createTestTenant(testData.testTenant, function(error, tenant) {
      if(error) return done(error);
      testData.testTenant = tenant;
      testData.testUser._tenantId = tenant._id;

      app.configuration.setConfig('masterTenantID', tenant._id);
      app.configuration.setConfig('masterTenantName', tenant.name);

      createTestUser(testData.testUser, function(error, user) {
        if(error) return done(error);
        testData.testUser._id = user._id;
        app.rolemanager.assignRoleByName('Super Admin', user._id, done);
      });
    });
  });
  // start server
  app.run();
});

after(function(done) {
  async.parallel([
    function removePolicies(cb) {
      permissions.clearPolicies(testData.testUser._id, cb);
    },
    function removeUser(cb) {
      usermanager.deleteUser({ _id: testData.testUser._id }, cb);
    },
    function removeTenant(cb) {
      tenantmanager.deleteTenant({ _id: testData.testTenant._id }, cb);
    },
    function removeRoles(cb) {
      app.rolemanager.retrieveRoles({}, {}, function(error, roles) {
        async.each(roles, function(role, cb2) {
          app.rolemanager.destroyRole(role._id, cb2);
        }, cb);
      });
    },
    function removeData(cb) {
      var dataDir = path.join(app.configuration.getConfig('root'), app.configuration.getConfig('dataRoot'));
      fs.remove(dataDir, cb);
    },
  ], done);
});

function createTestTenant (tenantDetails, cb) {
  tenantmanager.createTenant(tenantDetails, function(error, tenant) {
    if(error && error instanceof tenantmanager.errors.DuplicateTenantError) {
      return tenantmanager.retrieveTenant({name: tenantDetails.name}, cb);
    }
    return cb(error, tenant);
  });
}

function createTestUser (userDetails, cb) {
  auth.hashPassword(userDetails.plainPassword, function(error, hash) {
    if(error) return done(error);
    userDetails.password = hash;
    usermanager.createUser(userDetails, function(error, user) {
      if(error && error instanceof usermanager.errors.DuplicateUserError) {
        return usermanager.retrieveUser({email: userDetails.email}, cb);
      }
      return cb(error, user);
    });
  });
}

// Assumes any .js file in this folder is a test script
// Skips this file, non-recursive
function testLoader() {
  var contents = fs.readdirSync(__dirname);

  for(var i = 0, count = contents.length; i < count; i++) {
    var item = contents[i];
    if(path.join(__dirname, item) === __filename) continue;

    var parts = item.split('.');
    if(parts.pop() !== 'js') continue;

    describe(parts.pop(), function() { require('./' + item) });
  }
}

/**
* Entry point
*/
console.log('\n\nRunning mocha test suite');
testLoader();
