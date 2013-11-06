var path = require('path'),
    builder = require('../'),
    user = require('../lib/user.js')
    tenant = require('../lib/tenant.js');

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
    tenant.createTenant(helper.testTenant, function (error, res) {
      if (error) {
        done(error);
      } else {
        // update helper obj
        helper.testTenant = res;
        // assign user to test tenant
        helper.testUser.tenant = res._id;
        user.createUser(helper.testUser, function (error, res) {
          if (error) {
            done(error);
          } else {
            helper.testUser = res;
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
  user.deleteUser(helper.testUser, function (error) {
    if (error) {
      done(error);
    } else {
      tenant.deleteTenant(helper.testTenant, function (error) {
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
