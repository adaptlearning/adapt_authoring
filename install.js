// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var prompt = require('prompt');
var async = require('async');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var exec = require('child_process').exec;
var origin = require('./lib/application');
var auth = require('./lib/auth');
var database = require('./lib/database');
var helpers = require('./lib/helpers');
var localAuth = require('./plugins/auth/local');
var logger = require('./lib/logger');
var optimist = require('optimist');
var util = require('util');
var _ = require('underscore');
var ncp = require('ncp').ncp;
var installHelpers = require('./installHelpers');
var request = require('request');

var IS_INTERACTIVE = process.argv.length === 2;

var app = origin();
var masterTenant = false;
var superUser = false;
// from user input
var configResults;
var latestFrameworkTag;

// prompt config items
var installConfig = [
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
  {
    name: 'useffmpeg',
    type: 'string',
    description: "Will ffmpeg be used? y/N",
    before: function (v) {
      if (/(Y|y)[es]*/.test(v)) return true;
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
  {
    name: 'rootUrl',
    type: 'string',
    description: "The url this instance is accessed by",
    default: 'http://localhost:5000/'
  },
  {
    name: 'authoringToolRepository',
    type: 'string',
    description: "Authoring Tool Repository",
    default: 'https://github.com/adaptlearning/adapt_authoring.git'
  },
  {
    name: 'frameworkRepository',
    type: 'string',
    description: "Framework Repository",
    default: 'https://github.com/adaptlearning/adapt_framework.git'
  },
  {
    name: 'frameworkRevision',
    type: 'string',
    description: "Framework revision to install (branchName || tags/tagName)",
    default: 'tags/' + latestFrameworkTag
  }
];

var tenantConfig = [
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

var userConfig = [
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
  },
  {
    name: 'retypePassword',
    type: 'string',
    description: "Retype Password",
    hidden: true,
    required: true
  }
];

start();

function start() {
  prompt.override = optimist.argv; // allow command line arguments
  prompt.start();
  prompt.message = '> ';
  prompt.delimiter = '';
  // set overrides from command line arguments
  prompt.override = optimist.argv;
  prompt.start();
  // Prompt the user to begin the install
  if (!IS_INTERACTIVE) {
    console.log('This script will install the application. Please wait ...');
  } else {
    console.log('This script will install the application. Would you like to continue?');
  }
  prompt.get({ name: 'install', description: 'Y/n', type: 'string', default: 'Y' }, function (err, result) {
    if (!/(Y|y)[es]*$/.test(result['install'])) {
      return exitInstall();
    }
    async.series(steps, function (err, results) {
      if (err) {
        console.error('ERROR: ', err);
        return exitInstall(1, 'Install was unsuccessful. Please check the console output.');
      }
      exitInstall();
    });
  });
}

var steps = [
  function configureEnvironment(next) {
    if(!IS_INTERACTIVE) {
      console.log('Now setting configuration items.');
    } else {
      console.log('We need to configure the tool before install. Just press ENTER to accept the default value (in brackets).');
    }
    installHelpers.getLatestFrameworkVersion(function(error, version) {
      if (error) {
        console.error('ERROR: ', error);
        return exitInstall(1, 'Framework install failed. See console output for possible reasons.');
      }
      latestFrameworkTag = version;
      prompt.get(authoringConfig, function(err, results) {
        configResults = results;
        if (err) {
          console.error('ERROR: ', err);
          return exitInstall(1, 'Could not save configuration items.');
        }
        saveConfig(configResults, next);
      });
    });
  },
  function installFramework(next) {
    installHelpers.installFramework({
      repository: configResults.frameworkRepository,
      revision: configResults.frameworkRevision,
      force: true
    }, function(err) {
      if (err) {
        console.error('ERROR: ', err);
        return exitInstall(1, 'Framework install failed. See console output for possible reasons.');
      }
      // Remove the default course
      rimraf(path.resolve(__dirname, 'adapt_framework', 'src', 'course'), function(err) {
        if (err) {
          console.error('ERROR: ', err);
          return exitInstall(1, 'Framework install failed, unable to remove default course.');
        }
        next();
      });
    });
  },
  function configureTenant (next) {
    console.log("Checking configuration, please wait a moment ... ");
    // suppress app log output
    logger.clear();
    // run the app
    app.run();
    app.on('serverStarted', function () {
      if(!IS_INTERACTIVE) {
        console.log('Creating your tenant. Please wait ...');
      } else {
        console.log('Now create your tenant. Just press ENTER to accept the default value (in brackets). Please wait ...');
      }
      prompt.get(tenantConfig, function (err, result) {
        if (err) {
          console.error('ERROR: ', err);
          return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
        }
        // check if the tenant name already exists
        app.tenantmanager.retrieveTenant({ name: result.name }, function (err, tenant) {
          if (err) {
            console.error('ERROR: ', err);
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
                  console.error('ERROR: ', err);
                  return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
                }

                masterTenant = tenant;
                console.log("Tenant " + tenant.name + " was created. Now saving configuration, please wait ...");
                // save master tenant name to config
                app.configuration.setConfig('masterTenantName', tenant.name);
                app.configuration.setConfig('masterTenantID', tenant._id);
                saveConfig(app.configuration.getConfig(), cb);
              }
            );
          };
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
              if(err){
                console.error('ERROR: ' + err);
              }

              if (!/(Y|y)[es]*/.test(result.confirm)) {
                return exitInstall(1, 'Exiting install ... ');
              }

              // buh-leted
              _deleteCollections(function (err) {
                if (err) {
                  console.error('ERROR: ' + err);
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
  function createSuperUser (next) {
    if(!IS_INTERACTIVE) {
      console.log("Creating the super user account. This account can be used to manage everything on your " + app.polyglot.t('app.productname') + " instance.");
    } else {
      console.log("Create the super user account. This account can be used to manage everything on your " + app.polyglot.t('app.productname') + " instance.");
    }
    prompt.get(userConfig, function (err, result) {
      if (err) {
        console.error('ERROR: ', err);
        return exitInstall(1, 'Tenant creation was unsuccessful. Please check the console output.');
      }
      var userEmail = result.email;
      var userPassword = result.password;
      var userRetypePassword = result.retypePassword;
      // ruthlessly remove any existing users (we're already nuclear if we've deleted the existing tenant)
      app.usermanager.deleteUser({ email: userEmail }, function (err, userRec) {
        if (err) {
          console.error('ERROR: ', err);
          return exitInstall(1, 'User account creation was unsuccessful. Please check the console output.');
        }
        // add a new user using default auth plugin
        new localAuth().internalRegisterUser(true, {
            email: userEmail,
            password: userPassword,
            retypePassword: userRetypePassword,
            _tenantId: masterTenant._id
          }, function (err, user) {
            if (err) {
              console.error('ERROR: ', err);
              return exitInstall(1, 'User account creation was unsuccessful. Please check the console output.');
            }
            superUser = user;
            // grant super permissions!
            helpers.grantSuperPermissions(user._id, function (err) {
              if (err) {
                console.error('ERROR: ', err);
                return exitInstall(1, 'User account creation was unsuccessful. Please check the console output.');
              }

              return next();
            });
          }
        );
      });
    });
  },
  function gruntBuild (next) {
    console.log('Compiling the ' + app.polyglot.t('app.productname') + ' web application, please wait a moment ... ');
    var proc = exec('grunt build:prod', { stdio: [0, 'pipe', 'pipe'] }, function (err) {
      if (err) {
        console.error('ERROR: ', err);
        console.log('grunt build:prod command failed. Is the grunt-cli module installed? You can install using ' + 'npm install -g grunt grunt-cli');
        console.log('Install will continue. Try running ' + 'grunt build:prod' + ' after installation completes.');
        return next();
      }
      console.log('The ' + app.polyglot.t('app.productname') + ' web application was compiled and is now ready to use.');
      return next();
    });
    proc.stdout.on('data', console.log);
    proc.stderr.on('data', console.error);
  },
  function finalize (next) {
    exitInstall(0, "Installation completed successfully, the server can now be started.");
    return next();
  }
];

// helper functions

/**
 * This will write out the config items both as a config.json file and
 * as a .env file for foreman
 *
 * @param {object} configItems
 * @param {callback} next
 */

function saveConfig (configItems, next) {
  //pass by reference so as not to delete frameworkRevision
  var config = _.clone(configItems);
  var env = [];

  Object.keys(config).forEach(function (key) {
    env.push(key + "=" + config[key]);
  });
  // write the env file!
  if (0 === fs.writeSync(fs.openSync('.env', 'w'), env.join("\n"))) {
    console.error('ERROR: Failed to write .env file. Do you have write permissions for the current directory?');
    process.exit(1, 'Install Failed.');
  }
  // Defaulting these config settings until there are actual options.
  config.outputPlugin = 'adapt';
  config.dbType = 'mongoose';
  config.auth = 'local';
  config.root = process.cwd();
  delete config.frameworkRevision;
  if(config.smtpService !== ''){
    config.useSmtp = true;
  }
  // write the config.json file!
  if (0 === fs.writeSync(fs.openSync(path.join('conf', 'config.json'), 'w'), JSON.stringify(config))) {
    console.error('ERROR: Failed to write conf/config.json file. Do you have write permissions for the directory?');
    process.exit(1, 'Install Failed.');
  }
  return next();
}

/**
 * Exits the install with some cleanup, should there be an error
 *
 * @param {int} code
 * @param {string} msg
 */

function exitInstall(code, msg) {
  code = code || 0;
  msg = msg || 'Bye!';
  console.log('\n' + (code === 0 ? chalk.green(msg) : chalk.red(msg)) + '\n');
  // handle borked tenant, users, in case of a non-zero exit
  if (0 !== code && app && app.db && masterTenant) {
    return app.db.destroy('tenant', { _id: masterTenant._id }, function (err) {
      if(!superUser) {
        return process.exit(code);
      }
      app.db.destroy('user', { _id: superUser._id }, function (err) {
        return process.exit(code);
      });
    });
  }
  process.exit(code);
}
