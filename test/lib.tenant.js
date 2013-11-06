var path = require('path'),
    configuration = require('../lib/configuration'),
    tenant = require('../lib/tenant.js'),
    builder = require('../');

describe('tenant', function(){
  var tenantRec = {
    name: "unit-test-tenant",
    active: true
  };

  // ensure the tenant record is deleted
  after (function () {
    tenant.retrieveTenant({ name: tenantRec.name }, function (error, record) {
      if (error) {
        done(error)
      } else if (record) {
        tenant.deleteTenant(tenantRec, function(error) {
          if (error) {
            throw error;
          }
        });
      }
    });
  });

  it ('should allow the creation of a new tenant', function(done) {
    tenant.createTenant(tenantRec, done);
  });

  it ('should allow the retrieval of a single tenant', function(done) {
    tenant.retrieveTenant({ name: tenantRec.name }, function (error, record) {
      if (error) {
        done(error);
      } else if (record) {
        done();
      } else {
        done(new Error('Failed to retrieve tenant record'));
      }
    });
  });

  it ('should allow updating of a tenant', function(done) {
    tenant.updateTenant({ name: tenantRec.name }, { active: false } , function (error, result) {
      if (error) {
        done(error);
      } else {
        // verify that the update occurred
        tenant.retrieveTenant({ name: tenantRec.name }, function (error, record) {
          if (!record.active) { // it worked
            done();
          } else {
            done(new Error('Failed to update tenant'));
          }
        });
      }
    });
  });

  it ('should allow the deleting of tenants', function(done) {
    tenant.deleteTenant( { name: tenantRec.name }, function (error) {
      if (error) {
        done(error);
      } else {
        // verify the tenant was deleted
        tenant.retrieveTenant({ name: tenantRec.name }, function (error, record) {
          if (!record) { // it worked
            done();
          } else {
            done(new Error('Failed to delete tenant'));
          }
        });
      }
    });
  });
});
