// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var prompt = require('prompt'),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    exec = require('child_process').exec,
    builder = require('./lib/application'),
    frameworkHelper = require('./lib/frameworkhelper'),
    auth = require('./lib/auth'),
    database = require('./lib/database'),
    helpers = require('./lib/helpers'),
    localAuth = require('./plugins/auth/local'),
    logger = require('./lib/logger'),
    optimist = require('optimist'),
    util = require('util');

// set overrides from command line arguments
prompt.override = optimist.argv;
prompt.start();

prompt.message = '> ';
prompt.delimiter = '';

// get available db drivers and auth plugins
var drivers = database.getAvailableDriversSync();
var auths = auth.getAvailableAuthPluginsSync();
var app = builder();
var masterTenant = false;
var superUser = false;

var isVagrant = function () {
  if (process.argv.length > 2) {
        return true;
  }

  return false;
};

// config items
var configItems = [
  {
    name: 'serverPort',
    type: 'number',
    description: 'Server port',
    pattern: /^[0-9]+\W*$/,
    default: 5000
  },
  {
    name: 'serverName',
    type: 'string',
    description: 'Server name',
    default: 'localhost'
  },
  // {
  //   name: 'dbType',
  //   type: 'string',
  //   description: getDriversPrompt(),
  //   conform: function (v) {
  //     // validate against db drivers
  //     v = parseInt(v, 10);
  //     return  v > 0 && v <= drivers.length;
  //   },
  //   before: function (v) {
  //     // convert's the numeric answer to one of the available drivers
  //     return drivers[(parseInt(v, 10) - 1)];
  //   },
  //   default: '1'
  // },
  {
    name: 'dbHost',
    type: 'string',
    description: 'Database host',
    default: 'localhost'
  },
  {
    name: 'dbName',
    type: 'string',
    description: 'Master database name',
    pattern: /^[A-Za-z0-9_-]+\W*$/,
    default: 'adapt-tenant-master'
  },
  {
    name: 'dbPort',
    type: 'number',
    description: 'Database server port',
    pattern: /^[0-9]+\W*$/,
    default: 27017
  },
  {
    name: 'dataRoot',
    type: 'string',
    description: 'Data directory path',
    pattern: /^[A-Za-z0-9_-]+\W*$/,
    default: 'data'
  },
  {
    name: 'sessionSecret',
    type: 'string',
    description: 'Session secret',
    pattern: /^.+$/,
    default: 'your-session-secret'
  },
  // {
  //   name: 'auth',
  //   type: 'string',
  //   description: getAuthPrompt(),
  //   conform: function (v) {
  //     // validate against auth types
  //     v = parseInt(v, 10);
  //     return  v > 0 && v <= auths.length;
  //   },
  //   before: function (v) {
  //     // convert's the numeric answer to one of the available auth types
  //     return auths[(parseInt(v, 10) - 1)];
  //   },
  //   default: '1'
  // },
  {
    name: 'useffmpeg',
    type: 'string',
    description: "Will ffmpeg be used? y/N",
    before: function (v) {
      if (/(Y|y)[es]*/.test(v)) {
        return true;
      }
      return false;
    },
    default: 'N'
  },
  {
    name: 'smtpService',
    type: 'string',
    description: "Which SMTP service (if any) will be used? (see https://github.com/andris9/nodemailer-wellknown#supported-services for a list of supported services.)",
    default: 'none'
  },
  {
    name: 'smtpUsername',
    type: 'string',
    description: "SMTP username",
    default: ''
  },
  {
    name: 'smtpPassword',
    type: 'string',
    description: "SMTP password",
    hidden: true
  },
  {
    name: 'fromAddress',
    type: 'string',
    description: "Sender email address",
    default: ''
  },
  // {
  //   name: 'outputPlugin',
  //   type: 'string',
  //   description: "Which output plugin will be used?",
  //   default: 'adapt'
  // }
];

tenantConfig = [
  {
    name: 'name',
    type: 'string',
    description: "Set a unique name for your tenant",
    pattern: /^[A-Za-z0-9_-]+\W*$/,
    default: 'master'
  },
  {
    name: 'displayName',
    type: 'string',
    description: 'Set the display name for your tenant',
    required: true,
    default: 'Master'
  }
];

userConfig = [
  {
    name: 'email',
    type: 'string',
    description: "Email address",
    required: true
  },
  {
    name: 'password',
    type: 'string',
    description: "Password",
    hidden: true,
    required: true
  }
];

/**
 * Installer steps
 *
 * 1. install the framework
 * 2. add config vars
 * 3. configure master tenant
 * 4. create admin account
 * 5. TODO install plugins
 */
var steps = [
  // install the framework
  function installFramework (next) {
    // AB-277 always remove framework folder on install
    rimraf(path.resolve(__dirname, 'adapt_framework'), function () {
      // now clone the framework
      frameworkHelper.cloneFramework(function (err) {
        if (err) {
      	  console.log('ERROR: ', err);
          return exitInstall(1, 'Framework install failed. See console output for possible reasons.');
        }

        // Remove the default course
        rimraf(path.resolve(__dirname, 'adapt_framework', 'src', 'course'), function(err) {
          if (err) {
            console.log('ERROR: ', err);
            return exitInstall(1, 'Framework install error -- unable to remove default course.');
          }

          return next();
        });
      });
     });
  },

   function configureEnvironment(next) {
     if (isVagrant()) {
       console.log('Now setting configuration items.');
     } else {
       console.log('Now set configuration items. Just press ENTER to accept the default value (in brackets).');
     }
     prompt.get(configItems, function (err, results) {
       if (err) {
         console.log('ERROR: ', err);
         return exitInstall(1, 'Could not save configuration items.');
       }

       saveConfig(results, next);
     });
   },
  // configure tenant
  function configureTenant (next) {
    console.log("Checking configuration, please wait a moment ... ");
    // suppress app log output
    logger.clear();

    // run the app
    app.run();
    app.on('serverStarted', function () {
      if (isVagrant()) {
        console.log('Creating your tenant. Please wait ...');
      } else {
        console.log('Now create your tenant. Just press ENTER to accept the default value (in brackets). Please wait ...');
      }
      prompt.get(tenantConfig, function (err, result) {
        if (err) {
          console.log('ERROR: ', err);
          return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
        }
        // check if the tenant name already exists
        app.tenantmanager.retrieveTenant({ name: result.name }, function (err, tenant) {
          if (err) {
            console.log('ERROR: ', err);
            return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
          }

          var tenantName = result.name;
          var tenantDisplayName = result.displayName;

          // create the tenant according to the user provided details
          var _createTenant = function (cb) {
            console.log("Creating file system for tenant: " + tenantName + ", please wait ...");
            app.tenantmanager.createTenant({
                name: tenantName,
                displayName: tenantDisplayName,
                isMaster: true,
                database: {
                  dbName: app.configuration.getConfig('dbName'),
                  dbHost: app.configuration.getConfig('dbHost'),
                  dbUser: app.configuration.getConfig('dbUser'),
                  dbPass: app.configuration.getConfig('dbPass'),
                  dbPort: app.configuration.getConfig('dbPort')
                }
              },
              function (err, tenant) {
                if (err || !tenant) {
                  console.log('ERROR: ', err);
                  return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
                }

                masterTenant = tenant;
                console.log("Tenant " + tenant.name + " was created. Now saving configuration, please wait ...");
                // save master tenant name to config
                configuration.setConfig('masterTenantName', tenant.name);
                configuration.setConfig('masterTenantID', tenant._id);
                saveConfig(configuration.getConfig(), cb);
              }
            );
          };

          // deletes all collections in the db
          var _deleteCollections = function (cb) {
            async.eachSeries(
              app.db.getModelNames(),
              function (modelName, nxt) {
                app.db.destroy(modelName, null, nxt);
              },
              cb
            );
          };

          if (tenant) {
            // deal with duplicate tenant. permanently.
            console.log("Tenant already exists. It will be deleted.");
            return prompt.get({ name: "confirm", description: "Continue? (Y/n)", default: "Y" }, function (err, result) {
              if (err || !/(Y|y)[es]*/.test(result.confirm)) {
                return exitInstall(1, 'Exiting install ... ');
              }

              // buh-leted
              _deleteCollections(function (err) {
                if (err) {
                  return next(err);
                }

                return _createTenant(next);
              });
            });
          }

          // tenant is fresh
          return _createTenant(next);
        });
      });
    });
  },
  // install content plugins
  function installContentPlugins (next) {
    // Interrogate the adapt.json file from the adapt_framework folder and install the latest versions of the core plugins
     fs.readFile(path.join(process.cwd(), 'temp', app.configuration.getConfig('masterTenantID').toString(), 'adapt_framework', 'adapt.json'), function (err, data) {
      if (err) {
        console.log('ERROR: ' + err);
        return next(err);
      }

      var json = JSON.parse(data);
      // 'dependencies' contains a key-value pair representing the plugin name and the semver
      var plugins = Object.keys(json.dependencies);

      async.eachSeries(plugins, function(plugin, pluginCallback) {
        if(json.dependencies[plugin] === '*') {
          app.bowermanager.installLatestCompatibleVersion(plugin, pluginCallback);
        } else {
          app.bowermanager.installPlugin(plugin, json.dependencies[plugin], pluginCallback);
        }
      }, next);
    });
  },
  // configure the super awesome user
  function createSuperUser (next) {
    if (isVagrant()) {
      console.log("Creating the super user account. This account can be used to manage everything on your " + app.polyglot.t('app.productname') + " instance.");
    } else {
      console.log("Create the super user account. This account can be used to manage everything on your " + app.polyglot.t('app.productname') + " instance.");
    }

    prompt.get(userConfig, function (err, result) {
      if (err) {
        console.log('ERROR: ', err);
        return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
      }

      var userEmail = result.email;
      var userPassword = result.password;
      // ruthlessly remove any existing users (we're already nuclear if we've deleted the existing tenant)
      app.usermanager.deleteUser({ email: userEmail }, function (err, userRec) {
        if (err) {
          console.log('ERROR: ', err);
          return exitInstall(1, 'User account creation was unsuccessful. Please check the console output.');
        }

        // add a new user using default auth plugin
        new localAuth().internalRegisterUser({
            email: userEmail,
            password: userPassword,
            _tenantId: masterTenant._id
          }, function (err, user) {
            if (err) {
              console.log('ERROR: ', err);
              return exitInstall(1, 'User account creation was unsuccessful. Please check the console output.');
            }

            superUser = user;
            // grant super permissions!
            helpers.grantSuperPermissions(user._id, function (err) {
              if (err) {
                console.log('ERROR: ', err);
                return exitInstall(1, 'User account creation was unsuccessful. Please check the console output.');
              }

              return next();
            });
          }
        );
      });
    });
  },
  // run grunt build
  function gruntBuild (next) {
    console.log('Compiling the ' + app.polyglot.t('app.productname') + ' web application, please wait a moment ... ');
    var proc = exec('grunt build:prod', { stdio: [0, 'pipe', 'pipe'] }, function (err) {
      if (err) {
        console.log('ERROR: ', err);
        console.log('grunt build:prod command failed. Is the grunt-cli module installed? You can install using ' + 'npm install -g grunt grunt-cli');
        console.log('Install will continue. Try running ' + 'grunt build:prod' + ' after installation completes.');
        return next();
      }

      console.log('The ' + app.polyglot.t('app.productname') + ' web application was compiled and is now ready to use.');
      return next();
    });

    // pipe through any output from grunt
    proc.stdout.on('data', console.log);
    proc.stderr.on('data', console.log);
  },
  // all done
  function finalize (next) {
    if (isVagrant()) {
      console.log("Installation complete.\nTo restart your instance run the command 'pm2 restart all'");
    } else {
      console.log("Installation complete.\n To restart your instance run the command 'node server' (or 'foreman start' if using heroku toolbelt).");
    }

    return next();
  }
];

// set overrides from command line arguments
prompt.override = optimist.argv;

prompt.start();

// Prompt the user to begin the install
if (isVagrant()) {
  console.log('This script will install the application. Please wait ...');
} else {
  console.log('This script will install the application. Would you like to continue?');
}

prompt.get({ name: 'install', description: 'Y/n', type: 'string', default: 'Y' }, function (err, result) {
  if (!/(Y|y)[es]*$/.test(result['install'])) {
    return exitInstall();
  }

  // run steps
  async.series(steps, function (err, results) {
    if (err) {
      console.log('ERROR: ', err);
      return exitInstall(1, 'Install was unsuccessful. Please check the console output.');
    }

    exitInstall();
  });
});

// helper functions

/**
 * This will write out the config items both as a config.json file and
 * as a .env file for foreman
 *
 * @param {object} configItems
 * @param {callback} next
 */

function saveConfig (configItems, next) {
  var env = [];
  Object.keys(configItems).forEach(function (key) {
    env.push(key + "=" + configItems[key]);
  });

  // write the env file!
  if (0 === fs.writeSync(fs.openSync('.env', 'w'), env.join("\n"))) {
    console.log('ERROR: Failed to write .env file. Do you have write permissions for the current directory?');
    process.exit(1, 'Install Failed.');
  }

  // Defaulting these config settings until there are actual options.
  configItems.outputPlugin = 'adapt';
  configItems.dbType = 'mongoose';
  configItems.auth = 'local';

  // write the config.json file!
  if (0 === fs.writeSync(fs.openSync(path.join('conf', 'config.json'), 'w'), JSON.stringify(configItems))) {
    console.log('ERROR: Failed to write conf/config.json file. Do you have write permissions for the directory?');
    process.exit(1, 'Install Failed.');
  }
  return next();
}

/**
 * writes an indexed prompt for available db drivers
 *
 * @return {string}
 */

function getDriversPrompt() {
  var str = "Choose your database driver type (enter a number)\n";
  drivers.forEach(function (d, index) {
    str += (index+1) + ". " + d + "\n";
  });

  return str;
}

/**
 * writes an indexed prompt for available authentication plugins
 *
 * @return {string}
 */

function getAuthPrompt () {
  var str = "Choose your authentication method (enter a number)\n";
  auths.forEach(function (a, index) {
    str += (index+1) + ". " + a + "\n";
  });

  return str;
}

/**
 * Exits the install with some cleanup, should there be an error
 *
 * @param {int} code
 * @param {string} msg
 */

function exitInstall (code, msg) {
  code = code || 0;
  msg = msg || 'Bye!';
  console.log(msg);

  // handle borked tenant, users, in case of a non-zero exit
  if (0 !== code) {
    if (app && app.db) {
      if (masterTenant) {
        return app.db.destroy('tenant', { _id: masterTenant._id }, function (err) {
          if (superUser) {
            return app.db.destroy('user', { _id: superUser._id }, function (err) {
              return process.exit(code);
            });
          }

          return process.exit(code);
        });
      }
    }
  }

  process.exit(code);
}
