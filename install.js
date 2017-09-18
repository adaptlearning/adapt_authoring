var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
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
// config for prompt inputs
var inputData;
var inputHelpers = {
  passwordReplace: '*',
  numberValidator: /^[0-9]+\W*$/,
  alphanumValidator: /^[A-Za-z0-9_-]+\W*$/,
  toBoolean: function(v) {
    if(/(Y|y)[es]*/.test(v)) return true;
    return false;
  }
};
var masterTenant = false;
var superUser = false;
// from user input
var configResults;

// we need the framework version for the config items, so let's go
installHelpers.getLatestFrameworkVersion(function(error, latestFrameworkTag) {
  if(error) {
    console.error('ERROR: ', error);
    return exit(1, 'Failed to get latest framework version');
  }
  inputData = {
    useConfigJSON: {
      name: 'useJSON',
      description: 'Use JSON values? y/N',
      type: 'string',
      before: inputHelpers.toBoolean,
      default: 'N'
    },
    startInstall: {
      name: 'install',
      description: 'Continue? Y/n',
      type: 'string',
      before: inputHelpers.toBoolean,
      default: 'Y'
    },
    configure: [
      {
        name: 'serverPort',
        type: 'number',
        description: 'Server port',
        pattern: inputHelpers.numberValidator,
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
        pattern: inputHelpers.alphanumValidator,
        default: 'adapt-tenant-master'
      },
      {
        name: 'dbPort',
        type: 'number',
        description: 'Database server port',
        pattern: inputHelpers.numberValidator,
        default: 27017
      },
      {
        name: 'dataRoot',
        type: 'string',
        description: 'Data directory path',
        pattern: inputHelpers.alphanumValidator,
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
        before: inputHelpers.toBoolean,
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
        default: '-'
      },
      {
        name: 'smtpPassword',
        type: 'string',
        description: "SMTP password",
        hidden: true,
        replace: inputHelpers.passwordReplace,
        default: '-'
      },
      {
        name: 'fromAddress',
        type: 'string',
        description: "Sender email address",
        default: '-'
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
    ],
    tenant: [
      {
        name: 'name',
        type: 'string',
        description: "Set a unique name for your tenant",
        pattern: inputHelpers.alphanumValidator,
        default: 'master'
      },
      {
        name: 'displayName',
        type: 'string',
        description: 'Set the display name for your tenant',
        default: 'Master'
      }
    ],
    tenantDelete: {
      name: "confirm",
      description: "Continue? (Y/n)",
      before: inputHelpers.toBoolean,
      default: "Y"
    },
    superUser: [
      {
        name: 'suEmail',
        type: 'string',
        description: "Email address",
        required: true
      },
      {
        name: 'suPassword',
        type: 'string',
        description: "Password",
        hidden: true,
        replace: inputHelpers.passwordReplace,
        required: true
      },
      {
        name: 'suRetypePassword',
        type: 'string',
        description: "Retype Password",
        hidden: true,
        replace: inputHelpers.passwordReplace,
        required: true
      }
    ]
  };
  if(!IS_INTERACTIVE) {
    return;
  }
  if(!fs.existsSync('conf/config.json')) {
    initPrompt();
    start();
    return;
  }
  console.log('\nFound config.json file. Do you want to use the values in the file during install?');
  getInput(inputData.useConfigJSON, function(result) {
    initPrompt(result.useJSON);
    start();
  });
});

function initPrompt(shouldIncludeConfig) {
  // set overrides from command line arguments and config.json
  prompt.override = generatePromptOverrides(shouldIncludeConfig);
  prompt.message = '> ';
  prompt.delimiter = '';
  prompt.start();
}

function generatePromptOverrides(shouldIncludeConfig) {
  var configData = shouldIncludeConfig ? require('./conf/config.json') : {};
  // NOTE that config.json < cmd args
  return _.extend({}, configData, optimist.argv);
}

function start() {
  // Prompt the user to begin the install
  if(!IS_INTERACTIVE) {
    console.log('\nThis script will install the application. Please wait ...');
  } else {
    console.log('\nThis script will install the application. \nWould you like to continue?');
  }
  getInput(inputData.startInstall, function(result) {
    if(!result.install) {
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
    getInput(inputData.configure, function(result) {
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
  installHelpers.showSpinner('Starting server');
  // run the app
  app.run({ skipVersionCheck: true });
  app.on('serverStarted', function() {
    installHelpers.hideSpinner();
    getInput(inputData.tenant, function(result) {
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
        prompt.get(inputData.tenantDelete, function(error, result) {
          console.log('');
          if(error) {
            return onError(error);
          }
          if(!result.confirm) {
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
  console.log(`\nConfiguring super user account. This account can be used to manage everything on your ${app.polyglot.t('app.productname')} instance.`);
  getInput(inputData.superUser, function(result) {
    app.usermanager.deleteUser({ email: result.suEmail }, function(error, userRec) {
      if(error) return onError(error);
      // add a new user using default auth plugin
      new localAuth().internalRegisterUser(true, {
        email: result.suEmail,
        password: result.suPassword,
        retypePassword: result.suRetypePassword,
        _tenantId: masterTenant._id
      }, function(error, user) {
        // TODO should we allow a retry if the passwords don't match?
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
  installHelpers.buildAuthoring(function(error) {
    if(error) {
      return callback(`Failed to build the web application, (${error}) \nInstall will continue. Try again after installation completes using 'grunt build:prod'.`);
    }
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
  if(config.smtpService !== '') {
    config.useSmtp = true;
  }
  // write the config.json file!
  fs.writeJson(path.join('conf', 'config.json'), config, { spaces: 2 }, function(error) {
    if(error) {
      console.error(`ERROR: Failed to write conf/config.json file.\n${error}`);
      process.exit(1, 'Install Failed.');
    }
    return callback();
  });
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
