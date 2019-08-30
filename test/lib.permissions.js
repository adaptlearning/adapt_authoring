var should = require('should');

var configuration = require('../lib/configuration');
var permissions = require('../lib/permissions');
var rolemanager = require('../lib/rolemanager');
var usermanager = require('../lib/usermanager');

var testData = require('./testData.json').permissions;

var user = {
  email: testData.email
};

before(function(done) {
  user._tenantId = app.configuration.getConfig('masterTenantID');
  usermanager.createUser(user, function(error, userRec) {
    if(error) return done(error);
    user = userRec;
    permissions.createPolicy(user._id, function(error, policy) {
      if(error) return done(error);
      permissions.addStatement(policy, 'delete', permissions.buildResourceString(user._tenantId, '/foos/*'), 'allow', function(error) {
        if(error) return done(error);
        return rolemanager.assignRoleByName('Authenticated User', user._id, done);
      });
    });
  });
});

after(function(done) {
  permissions.clearPolicies(user._id, function(error) {
    if(error) return done(error);
    usermanager.deleteUser({ _id: user._id }, done);
  });
});

it('should be able to create permissions for a user', function(done) {
  permissions.createPolicy(user._id, function(error, policy) {
    should.not.exist(error);
    permissions.addStatement(policy, 'create', permissions.buildResourceString(user._tenantId, '/courses'), 'allow', done);
  });
});

it('should verify user permissions using an exact resource identifier', function(done) {
  permissions.hasPermission(user._id, 'create', permissions.buildResourceString(user._tenantId, '/courses'), function(error, allowed) {
    should.not.exist(error);
    allowed.should.be.true;
    done();
  });
});

it('should verify user permissions using a glob-type resource identifier', function(done) {
  permissions.hasPermission(user._id, 'delete', permissions.buildResourceString(user._tenantId, '/foos/bars'), function(error, allowed) {
    should.not.exist(error);
    allowed.should.be.true;
    done();
  });
});

it('should deny permission when the action is not matched', function(done) {
  permissions.hasPermission(user._id, 'delete', permissions.buildResourceString(user._tenantId, '/courses'), function(error, allowed) {
    should.not.exist(error);
    allowed.should.be.false;
    done();
  });
});

it('should deny permission when no specific policy exists', function(done) {
  permissions.hasPermission(user._id, 'create', permissions.buildResourceString(user._tenantId, '/foos'), function(error, allowed) {
    should.not.exist(error);
    allowed.should.be.false;
    done();
  });
});
