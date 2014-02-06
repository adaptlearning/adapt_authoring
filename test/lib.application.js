var path = require('path'),
    winston = require('winston'),
    builder = require('../'),
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
    enabled: true
  },
  testTenant: {
    name: "testTenant",
    active: true
  }
};

before(function (done) {
  // bootstrapping!
  var app = builder();
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
        helper.testUser.tenant = tenant._id;

        createTestUser(helper.testUser, function (error, user) {
          if (error) {
            return done(error);
          }

          helper.testUser._id = user._id;
          permissions.createPolicy(helper.testUser._id, function (error, policy) {
            permissions.addStatement(policy, ['create', 'read', 'update', 'delete'], permissions.buildResourceString(helper.testUser.tenant, '/*'), 'allow', function (error) {
              if (error) {
                return done(error);
              }

              // all set up!
              done();
            });
          });
        });
      }
    });

  });

  // start server
  app.start();
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

      tenantmanager.deleteTenant(helper.testTenant, function (error) {
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
    var app = builder();
    app.on('foo', done);
    app.emit('foo');
  });
});
