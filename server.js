var builder = require('./lib/application'),
    logger = require('./lib/logger'),
    winston = require('winston');

var app = builder();

app.start();

// add a route to quickly set up an admin user.
// NOTE: this is just a holdover untill we write
// a proper install script!!!
app.once('serverStarted', function (server) {
  require('./lib/permissions').ignoreRoute(/^\/install\/?$/);
  app.get('/install', function (req, res, next) {
    var userObj = {
      email: 'admin',
      password: '',
      plainPassword: 'password',
      auth: 'local',
      tenant: 0
    };

    require('./lib/auth').hashPassword(userObj.plainPassword, function (error, hash) {
      if (error) {
        return next(error);
      }

      userObj.password = hash;
      require('./lib/usermanager').createUser(userObj, function (error, user) {
        if (error) {
          return next(error);
        }

        // assign permissions for all!
        var permissions = require('./lib/permissions');
        permissions.createPolicy(user._id, function (error, policy) {
          // add a new policy statement
          permissions.addStatement(policy, ['create', 'read', 'update', 'delete'], permissions.buildResourceString(userObj.tenant, '/*'), 'allow', function (error) {
            if (error) {
              return next(error);
            }

            // notify user
            res.statusCode = 200;
            res.write("Install succeeded!\nEmail: " + userObj.email + "\nPassword:" + userObj.plainPassword);
            res.end();
          });
        });
      });
    });
  });
});
