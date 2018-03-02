var should = require('should');

var origin = require('../');
var configuration = require('../lib/configuration');
var path = require('path');
var tenantmanager = require('../lib/tenantmanager.js');

var testData = require('./testData.json').tenantmanager;

var tenantRec = {
  name: testData.name,
  displayName: testData.displayName,
  createdAt: new Date(),
  updatedAt: new Date(),
  isMaster: testData.isMaster,
  active: testData.active
};

after(function(done) {
  this.timeout(10000);
  tenantmanager.retrieveTenant({ _id: tenantRec._id }, function(error, tenant) {
    if(error) return done(error);
    if(!tenant) return done();
    tenantmanager.deleteTenant(tenantRec, done);
  });
});

it('should be able to create new tenants', function(done) {
  this.timeout(600000);
  tenantmanager.createTenant(tenantRec, function(error, tenant) {
    should.not.exist(error);
    should.exist(tenant);
    tenantRec = tenant;
    done();
  });
});

it('should be able to retrieve a single tenant', function(done) {
  tenantmanager.retrieveTenant({ name: tenantRec.name }, function(error, tenant) {
    should.not.exist(error);
    should.exist(tenant, 'Failed to retrieve tenant record');
    done();
  });
});

it('should be able to update tenants', function(done) {
  tenantmanager.updateTenant({ name: tenantRec.name }, { displayName: testData.newDisplayName } , function(error, tenant) {
    should.not.exist(error);
    // verify that the update occurred
    tenantmanager.retrieveTenant({ name: tenantRec.name }, function(error, tenant) {
      tenant.displayName.should.equal(testData.newDisplayName, 'Failed to update tenant');
      done();
    });
  });
});

it('should be able to delete tenants', function(done) {
  tenantmanager.deleteTenant( { name: tenantRec.name }, function(error) {
    should.not.exist(error);
    // verify the tenant was deleted
    tenantmanager.retrieveTenant({ name: tenantRec.name }, function(error, tenant) {
      should.not.exist(error);
      tenant.should.equal(false, 'Failed to delete tenant');
      done();
    });
  });
});
