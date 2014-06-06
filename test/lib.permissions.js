var origin = require('../'),
    should = require('should'),
    usermanager = require('../lib/usermanager'),
    permissions = require('../lib/permissions');

describe('permissions', function () {
  var user = {
    email: 'testpermissions@adapt.org',
    tenant: '0'
  };

  before(function (done) {
    // add a policy with delete access on all foos
    usermanager.createUser(user, function (error, userRec) {
      should.not.exist(error);
      user = userRec;
      permissions.createPolicy(user._id, function (error, policy) {
        should.not.exist(error);
        // add a new policy statement
        permissions.addStatement(policy, 'delete', permissions.buildResourceString(user.tenant, '/foos/*'), 'allow', function (error) {
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
    permissions.clearPolicies(user._id, function (error) {
      if (error) {
        return done(error);
      }

      usermanager.deleteUser({ _id: user._id }, done);
    });
  });

  it ('should should allow me to specify a permission for a user', function (done) {
    // permission
    permissions.createPolicy(user._id, function (error, policy) {
      should.not.exist(error);
      // add a new policy statement
      permissions.addStatement(policy, 'create', permissions.buildResourceString(user.tenant, '/courses'), 'allow', function (error) {
        if (error) {
          return done(error);
        }

        return done();
      });
    });
  });

  it ('should verify user permissions using an exact resource identifier', function (done) {
    // should have permission
    permissions.hasPermission(user._id, 'create', permissions.buildResourceString(user.tenant, '/courses'), function (error, allowed) {
      should.not.exist(error);
      allowed.should.be.true;
      done();
    });
  });

  it ('should verify user permissions using a glob-type resource identifier', function (done) {
    // should have permission
    permissions.hasPermission(user._id, 'delete', permissions.buildResourceString(user.tenant, '/foos/bars'), function (error, allowed) {
      should.not.exist(error);
      allowed.should.be.true;
      done();
    });
  });

  it ('should deny permission when the action is not matched', function (done) {
    // should have permission
    permissions.hasPermission(user._id, 'delete', permissions.buildResourceString(user.tenant, '/courses'), function (error, allowed) {
      should.not.exist(error);
      allowed.should.be.false;
      done();
    });
  });

  it ('should deny permission when no specific policy exists', function (done) {
    // should have permission
    permissions.hasPermission(user._id, 'create', permissions.buildResourceString(user.tenant, '/foos'), function (error, allowed) {
      should.not.exist(error);
      allowed.should.be.false;
      done();
    });
  });

});
