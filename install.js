var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var fs = require('fs');
var optimist = require('optimist');
var path = require('path');
var prompt = require('prompt');

var auth = require('./lib/auth');
var database = require('./lib/database');
var helpers = require('./lib/helpers');
var installHelpers = require('./installHelpers');
var localAuth = require('./plugins/auth/local');
var logger = require('./lib/logger');
var origin = require('./lib/application');

var IS_INTERACTIVE = process.argv.length === 2;

var app = origin();
var masterTenant = false;
var superUser = false;
// from user input
var configResults;

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
  if(!IS_INTERACTIVE) {
    console.log('\nThis script will install the application. Please wait ...');
  } else {
    console.log('\nThis script will install the application. \nWould you like to continue?');
  }
  getInput({ name: 'install', description: 'Continue? Y/n', type: 'string', default: 'Y' }, function(result) {
    if(/(N|n)[o]*$/.test(result['install'])) {
      return exit(0, 'User cancelled the install');
    }
    async.series([
      configureEnvironment,
      configureMasterTenant,
      createMasterTenant,
      createSuperUser,
      buildFrontend
    ], function(error, results) {
      if(error) {
        console.error('ERROR: ', error);
        return exit(1, 'Install was unsuccessful. Please check the console output.');
      }
      exit(0, `Installation completed successfully, the application can now be started with 'node server'.`);
    });
  });
}

function configureEnvironment(callback) {
  if(!IS_INTERACTIVE) {
    console.log('Now setting configuration items.');
  } else {
    console.log('We need to configure the tool before install. \nJust press ENTER to accept the default value (in brackets).');
  }
  installHelpers.getLatestFrameworkVersion(function(error, latestFrameworkTag) {
    if(error) {
      console.error('ERROR: ', error);
      return exit(1, 'Failed to get latest framework version');
    }
    getInput([
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
        before: function(v) {
          if(/(Y|y)[es]*/.test(v)) return true;
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
    ], function(result) {
      configResults = result;
      saveConfig(result, callback);
    });
  });
}

function configureMasterTenant(callback) {
  var onError = function(error) {
    console.error('ERROR: ', error);
    return exit(1, 'Failed to configure master tenant. Please check the console output.');
  };
  if(IS_INTERACTIVE) {
    console.log('Now we need to configure the master tenant. \nJust press ENTER to accept the default value (in brackets).\n');
  }
  logger.clear();
  // run the app
  app.run({ skipVersionCheck: true });
  app.on('serverStarted', function() {
    getInput([
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
    ], function(result) {
      // add the input to our cached config
      _.extend(configResults, { masterTenant: result });
      // check if the tenant name already exists
      app.tenantmanager.retrieveTenant({ name: result.name }, function(error, tenant) {
        if(error) {
          return onError(error);
        }
        if(!tenant) {
          return callback();
        }
        if(!IS_INTERACTIVE) {
          return exit(1, `Tenant '${tenant.name}' already exists, automatic install cannot continue.`);
        }
        console.log("Tenant already exists. It must be deleted for install to continue.");
        prompt.get({ name: "confirm", description: "Continue? (Y/n)", default: "Y" }, function(error, result) {
          console.log('');
          if(error) {
            return onError(error);
          }
          if(/(N|n)[o]*/.test(result.confirm)) {
            return exit(1, 'Exiting install...');
          }
          // delete tenant
          async.eachSeries(app.db.getModelNames(), function(modelName, cb) {
            app.db.destroy(modelName, null, cb);
          }, callback);
        });
      });
    });
  });
}

function createMasterTenant(callback) {
  app.tenantmanager.createTenant({
    name: configResults.masterTenant.name,
    displayName: configResults.masterTenant.displayName,
    isMaster: true,
    database: {
      dbName: app.configuration.getConfig('dbName'),
      dbHost: app.configuration.getConfig('dbHost'),
      dbUser: app.configuration.getConfig('dbUser'),
      dbPass: app.configuration.getConfig('dbPass'),
      dbPort: app.configuration.getConfig('dbPort')
    }
  }, function(error, tenant) {
    if(error) {
      console.error('ERROR: ', error);
      return exit(1, 'Failed to create master tenant. Please check the console output.');
    }
    console.log('Master tenant created successfully.');
    masterTenant = tenant;
    // save master tenant name to config
    app.configuration.setConfig('masterTenantName', tenant.name);
    app.configuration.setConfig('masterTenantID', tenant._id);
    saveConfig(app.configuration.getConfig(), callback);
  });
}

function createSuperUser(callback) {
  var onError = function(error) {
    console.error('ERROR: ', error);
    return exit(1, 'Failed to create admin user account. Please check the console output.');
  };
  console.log(`\nConfiguring super user account. This account can be used to manage everything on your ${app.polyglot.t('app.productname')} instance. \nJust press ENTER to accept the default value (in brackets).`);
  getInput([
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
  ], function(result) {
    app.usermanager.deleteUser({ email: result.email }, function(error, userRec) {
      if(error) return onError(error);
      // add a new user using default auth plugin
      new localAuth().internalRegisterUser(true, {
        email: result.email,
        password: result.password,
        retypePassword: result.retypePassword,
        _tenantId: masterTenant._id
      }, function(error, user) {
        if(error) {
          return onError(error);
        }
        superUser = user;
        helpers.grantSuperPermissions(user._id, function(error) {
          if(error) return onError(error);
          return callback();
        });
      }
    );
  });
});
}

function buildFrontend(callback) {
  console.log(`Building the web application.`);
  installHelpers.buildAuthoring(function(error) {
    if(error) {
      return callback(`Failed to build the web application, (${error}) \nInstall will continue. Try again after installation completes using 'grunt build:prod'.`);
    }
    console.log('Web application built.');
    callback();
  });
}

// helper functions

/**
 * This will write out the config items both as a config.json file and
 * as a .env file for foreman
 *
 * @param {object} configItems
 * @param {callback} callback
 */

function saveConfig(configItems, callback) {
  //pass by reference so as not to delete frameworkRevision
  var config = _.clone(configItems);
  var env = [];

  Object.keys(config).forEach(function(key) {
    env.push(key + "=" + config[key]);
  });
  // write the env file!
  if(0 === fs.writeSync(fs.openSync('.env', 'w'), env.join("\n"))) {
    console.error('ERROR: Failed to write .env file. Do you have write permissions for the current directory?');
    process.exit(1, 'Install Failed.');
  }
  // Defaulting these config settings until there are actual options.
  config.outputPlugin = 'adapt';
  config.dbType = 'mongoose';
  config.auth = 'local';
  config.root = process.cwd();
  // delete config.frameworkRevision;
  if(config.smtpService !== '') {
    config.useSmtp = true;
  }
  // write the config.json file!
  if(0 === fs.writeSync(fs.openSync(path.join('conf', 'config.json'), 'w'), JSON.stringify(config))) {
    console.error('ERROR: Failed to write conf/config.json file. Do you have write permissions for the directory?');
    process.exit(1, 'Install Failed.');
  }
  return callback();
}

function getInput(items, callback) {
  console.log('');
  prompt.get(items, function(error, result) {
    console.log('');
    if(error) {
      if(error.message = 'canceled') error = new Error('User cancelled the install');
      return exit(1, error);
    }
    callback(result);
  });
}

/**
 * Exits the install with some cleanup, should there be an error
 *
 * @param {int} code
 * @param {string} msg
 */

function exit(code, msg) {
  installHelpers.exit(code, msg, function(callback) {
    if(0 === code || app && !app.db || !masterTenant) {
      return callback();
    }
    // handle borked tenant, users, in case of a non-zero exit
    app.db.destroy('tenant', { _id: masterTenant._id }, function(error) {
      if(!superUser) return callback();
      app.db.destroy('user', { _id: superUser._id }, callback);
    });
  });
}
