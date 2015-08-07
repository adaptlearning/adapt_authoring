var path = require('path'),
    configuration = require('../lib/configuration'),
    tenantmanager = require('../lib/tenantmanager.js'),
    origin = require('../');

describe('tenant', function(){
  var tenantRec = {
    name: "unit-test-tenant",
    displayName: 'UnitTestTenant',
    createdAt: new Date(),
    updatedAt: new Date(),
    isMaster: true,
    active: true
  };

  // ensure the tenant record is deleted
  after (function (done) {
    this.timeout(10000);
    tenantmanager.retrieveTenant({ _id: tenantRec._id }, function (error, tenant) {
      if (error) {
        done(error)
      } else if (tenant) {
        tenantmanager.deleteTenant(tenantRec, function(error) {
          if (error) {
            done(error);
          }

          return done();
        });
      }

      // happily, the tenant doesn't exist
      return done(null);
    });
  });

  it ('should allow the creation of a new tenant', function(done) {
    this.timeout(600000);
    tenantmanager.createTenant(tenantRec, function (error, tenant) {
      if (error) {
        return done(error);
      }

      tenantRec = tenant;
      return done(null);
    });
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
