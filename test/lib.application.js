var path = require('path'),
    winston = require('winston'),
    builder = require('../'),
    usermanager = require('../lib/usermanager.js'),
    tenantmanager = require('../lib/tenantmanager.js');

var helper = {
  testUser: {
    email: "testuser@adapt.org",
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

  // add some test entities ...
  app.on('serverStarted', function (server) {
    tenantmanager.createTenant(helper.testTenant, function (error, tenant) {
      if (error) {
        done(error);
      } else {
        // update helper obj
        helper.testTenant = tenant;
        // assign user to test tenant
        helper.testUser.tenant = tenant._id;
        usermanager.createUser(helper.testUser, function (error, user) {
          if (error) {
            done(error);
          } else {
            helper.testUser = user;
            done();
          }
        });
      }
    });

  });

  // start server
  app.start();
});

after(function (done) {
  // remove test entities
  usermanager.deleteUser(helper.testUser, function (error) {
    if (error) {
      done(error);
    } else {
      tenantmanager.deleteTenant(helper.testTenant, function (error) {
        if (error) {
          done(error);
        } else {
          done();
        }
      });
    }
  });

});

describe('application', function(){
  it ('should inherit from event emmiter', function(done) {
    var app = builder();
    app.on('foo', done);
    app.emit('foo');
  });
});
