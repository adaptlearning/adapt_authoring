var path = require('path'),
    origin = require('../'),
    logger = require('../lib/logger'),
    auth = require('../lib/auth'),
    permissions = require('../lib/permissions'),
    usermanager = require('../lib/usermanager'),
    tenantmanager = require('../lib/tenantmanager');

var helper = {
  testUser: {
    email: "testuser@adapt.org",
    password: '',
    plainPassword: 'password',
    auth: 'local',
    _isDeleted: false
  },
  testTenant: {
    name: "adapt-tenant-unit-test",
    displayName: 'Test Tenant',
    isMaster: true
  }
};

before(function (done) {
  // this initialization appears to take a little longer
  this.timeout(600000);

  // suppress all logging!
  logger.clear();

  // bootstrapping!
  var app = origin();
  app.use({ configFile: path.join('test', 'testConfig.json')});

  function createTestTenant (tenantDetails, cb) {
    tenantmanager.createTenant(tenantDetails, function (error, tenant) {
      if (error) {
        // cleanup may have failed from a previous test
        if (error instanceof tenantmanager.errors.DuplicateTenantError) {
          return tenantmanager.retrieveTenant({name: tenantDetails.name}, cb);
        }

        return cb(error);
      }

      return cb(null, tenant);
    });
  }

  function createTestUser (userDetails, cb) {
    auth.hashPassword(userDetails.plainPassword, function (error, hash) {
      if (error) {
        return cb(error);
      }

      userDetails.password = hash;
      usermanager.createUser(userDetails, function (error, user) {
        if (error) {
          // cleanup failed
          if (error instanceof usermanager.errors.DuplicateUserError) {
            return usermanager.retrieveUser({email: userDetails.email}, cb);
          }

          return cb(error);
        }

        return cb(null, user);
      });
    });
  }

  // add some test entities ...
  app.on('serverStarted', function (server) {
    createTestTenant(helper.testTenant, function (error, tenant) {
      if (error) {
        return done(error);
      } else {
        // update helper obj
        helper.testTenant = tenant;
        // assign user to test tenant
        helper.testUser._tenantId = tenant._id;
        // set master tenant ID
        app.configuration.setConfig('masterTenantID', tenant._id);
        app.configuration.setConfig('masterTenantName', tenant.name);

        createTestUser(helper.testUser, function (error, user) {
          if (error) {
            return done(error);
          }

          helper.testUser._id = user._id;
          // this user is super ...
          app.rolemanager.assignRoleByName('Super Admin', user._id, done);
        });
      }
    });

  });

  // start server
  app.run();
});

after(function (done) {
  // remove test entities
  permissions.clearPolicies(helper.testUser._id, function (error) {
    if (error) {
      return done(error);
    }

    usermanager.deleteUser({ _id: helper.testUser._id }, function (error) {
      if (error) {
        return done(error);
      }

      tenantmanager.deleteTenant({ _id: helper.testTenant._id}, function (error) {
        if (error) {
          return done(error);
        }

        done();
      });
    });
  });
});

describe('application', function(){
  it ('should inherit from event emmiter', function(done) {
    var app = origin();
    app.on('foo', done);
    app.emit('foo');
  });
});
