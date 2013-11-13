var builder = require('../'),
    should = require('should'),
    usermanager = require('../lib/usermanager'),
    permissions = require('../lib/permissions');

describe('permissions', function () {

  before(function (done) {
    // add a policy with delete access on all foos
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      var uid = user._id;
      var tenantid = user.tenant;
      permissions.createPolicy(uid, function (error, policy) {
        should.not.exist(error);
        // add a new policy statement
        permissions.addStatement(policy, 'delete', permissions.buildResourceString(tenantid, '/foos/*'), 'allow', function (error) {
          if (error) {
            done(error);
          } else {
            done();
          }
        });
      });
    });
  });

  // cleanup - make sure we remove any policies we created
  after(function (done) {
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      permissions.clearPolicies(user._id, done);
    });
  });

  it ('should should allow me to specify a permission for a user', function (done) {
    // retrieve test user, then apply permission
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      var uid = user._id;
      var tenantid = user.tenant;
      permissions.createPolicy(uid, function (error, policy) {
        should.not.exist(error);
        // add a new policy statement
        permissions.addStatement(policy, 'create', permissions.buildResourceString(tenantid, '/courses'), 'allow', function (error) {
          if (error) {
            done(error);
          } else {
            done();
          }
        });
      });
    });
  });

  it ('should verify user permissions using an exact resource identifier', function (done) {
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      // should have permission
      permissions.hasPermission(user._id, 'create', permissions.buildResourceString(user.tenant, '/courses'), function (error, allowed) {
        should.not.exist(error);
        allowed.should.be.true;
        done();
      });
    });
  });

  it ('should verify user permissions using a glob-type resource identifier', function (done) {
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      // should have permission
      permissions.hasPermission(user._id, 'delete', permissions.buildResourceString(user.tenant, '/foos/bars'), function (error, allowed) {
        should.not.exist(error);
        allowed.should.be.true;
        done();
      });
    });
  });

  it ('should deny permission when the action is not matched', function (done) {
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      // should have permission
      permissions.hasPermission(user._id, 'delete', permissions.buildResourceString(user.tenant, '/courses'), function (error, allowed) {
        should.not.exist(error);
        allowed.should.be.false;
        done();
      });
    });
  });

  it ('should deny permission when no specific policy exists', function (done) {
    usermanager.retrieveUser({ email: "testuser@adapt.org" }, function (error, user) {
      should.not.exist(error);
      // should have permission
      permissions.hasPermission(user._id, 'create', permissions.buildResourceString(user.tenant, '/foos'), function (error, allowed) {
        should.not.exist(error);
        allowed.should.be.false;
        done();
      });
    });
  });

});
