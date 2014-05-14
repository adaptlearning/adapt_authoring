var path = require('path'),
    configuration = require('../lib/configuration'),
    tenantmanager = require('../lib/tenantmanager.js'),
    origin = require('../');

describe('tenant', function(){
  var tenantRec = {
    name: "unit-test-tenant",
    active: true
  };

  // ensure the tenant record is deleted
  after (function () {
    tenantmanager.retrieveTenant({ name: tenantRec.name }, function (error, tenant) {
      if (error) {
        done(error)
      } else if (tenant) {
        tenantmanager.deleteTenant(tenantRec, function(error) {
          if (error) {
            throw error;
          }
        });
      }
    });
  });

  it ('should allow the creation of a new tenant', function(done) {
    tenantmanager.createTenant(tenantRec, done);
  });

  it ('should allow the retrieval of a single tenant', function(done) {
    tenantmanager.retrieveTenant({ name: tenantRec.name }, function (error, tenant) {
      if (error) {
        done(error);
      } else if (tenant) {
        done();
      } else {
        done(new Error('Failed to retrieve tenant record'));
      }
    });
  });

  it ('should allow updating of a tenant', function(done) {
    tenantmanager.updateTenant({ name: tenantRec.name }, { active: false } , function (error, tenant) {
      if (error) {
        done(error);
      } else {
        // verify that the update occurred
        tenantmanager.retrieveTenant({ name: tenantRec.name }, function (error, tenant) {
          if (!tenant.active) { // it worked
            done();
          } else {
            done(new Error('Failed to update tenant'));
          }
        });
      }
    });
  });

  it ('should allow the deleting of tenants', function(done) {
    tenantmanager.deleteTenant( { name: tenantRec.name }, function (error) {
      if (error) {
        done(error);
      } else {
        // verify the tenant was deleted
        tenantmanager.retrieveTenant({ name: tenantRec.name }, function (error, tenant) {
          if (!tenant) { // it worked
            done();
          } else {
            done(new Error('Failed to delete tenant'));
          }
        });
      }
    });
  });
});
