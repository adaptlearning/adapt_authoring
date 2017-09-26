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
var USE_CONFIG;

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
    return exit(1, 'Failed to get the latest framework version');
  }
  inputData = {
    useConfigJSON: {
      name: 'useJSON',
      description: 'Use existing config values? y/N',
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
        description: 'Session secret (value used when saving session cookie data)',
        pattern: /^.+$/,
        default: 'your-session-secret'
      },
      {
        name: 'useffmpeg',
        type: 'string',
        description: "Are you using ffmpeg? y/N",
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
        default: ''
      },
      {
        name: 'smtpPassword',
        type: 'string',
        description: "SMTP password",
        hidden: true,
        replace: inputHelpers.passwordReplace,
        default: ''
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
        description: "The url this install will be accessible from",
        default: 'http://localhost:5000/'
      },
      {
        name: 'authoringToolRepository',
        type: 'string',
        description: "Git repository URL to be used for the authoring tool source code",
        default: 'https://github.com/adaptlearning/adapt_authoring.git'
      },
      {
        name: 'frameworkRepository',
        type: 'string',
        description: "Git repository URL to be used for the framework source code",
        default: 'https://github.com/adaptlearning/adapt_framework.git'
      },
      {
        name: 'frameworkRevision',
        type: 'string',
        description: "Specific git revision to be used for the framework (expects either a branch name, or a tag with the format `tags/tagName`)",
        default: 'tags/' + latestFrameworkTag
      }
    ],
    tenant: [
      {
        name: 'masterTenantName',
        type: 'string',
        description: "Set a unique name for your tenant",
        pattern: inputHelpers.alphanumValidator,
        default: 'master'
      },
      {
        name: 'masterTenantDisplayName',
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
        description: "Confirm Password",
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
  console.log('\nFound an existing config.json file. Do you want to use the values in this file during install?');
  getInput(inputData.useConfigJSON, function(result) {
    USE_CONFIG = result.useJSON;
    initPrompt();
    start();
  });
});

function initPrompt() {
  // set overrides from command line arguments and config.json
  prompt.override = generatePromptOverrides();
  prompt.message = '> ';
  prompt.delimiter = '';
  prompt.start();
}

function generatePromptOverrides() {
  var configData = USE_CONFIG ? require('./conf/config.json') : {};
  configData = JSON.parse(JSON.stringify(configData).replace('true', '"y"').replace('false', '"n"'));
  if(USE_CONFIG) configData.install = 'y';
  // NOTE that config.json < cmd args
  return _.extend({}, configData, optimist.argv);
}

function start() {
  // Prompt the user to begin the install
  if(!IS_INTERACTIVE || USE_CONFIG) {
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
  if(!IS_INTERACTIVE || USE_CONFIG) {
    console.log('Now setting configuration items.');
  } else {
    console.log('We need to configure the tool before install. \nTip: just press ENTER to accept the default value in brackets.');
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
    console.log('Now we need to configure the master tenant. \nTip: just press ENTER to accept the default value in brackets.\n');
  }
  logger.clear();
  installHelpers.showSpinner('Starting server');
  // run the app
  app.run({ skipVersionCheck: true });
  app.on('serverStarted', function() {
    installHelpers.hideSpinner();
    getInput(inputData.tenant, function(result) {
      // add the input to our cached config
      _.extend(configResults, {
        masterTenant: {
          name: result.masterTenantName,
          displayName: result.masterTenantName
        }
      });
      // check if the tenant name already exists
      app.tenantmanager.retrieveTenant({ name: result.masterTenantName }, function(error, tenant) {
        if(error) {
          return onError(error);
        }
        if(!tenant) {
          return callback();
        }
        if(!IS_INTERACTIVE) {
          return exit(1, `Tenant '${tenant.name}' already exists, automatic install cannot continue.`);
        }
        console.log(`Tenant '${tenant.name}' already exists. It must be deleted for install to continue.`);
        prompt.get(inputData.tenantDelete, function(error, result) {
          console.log('');
          if(error) {
            return onError(error);
          }
          if(!result.confirm) {
            return exit(1, 'Exiting install.');
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
 * This will write out the config items both as a config.json file
 *
 * @param {object} configItems
 * @param {callback} callback
 */

function saveConfig(configItems, callback) {
  // add some default values as these aren't set
  var config = {
    outputPlugin: 'adapt',
    dbType: 'mongoose',
    auth: 'local',
    root: process.cwd()
  };
  // copy over the input values
  _.each(configItems, function(value, key) {
    config[key] = value;
  });
  if(config.smtpService !== '') {
    config.useSmtp = true;
  }
  fs.writeJson(path.join('conf', 'config.json'), config, { spaces: 2 }, function(error) {
    if(error) {
      console.error(`ERROR: Failed to write configuration file to ${chalk.underline(conf/config.json)}.\n${error}`);
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
      if(error.message === 'canceled') error = new Error('User cancelled the install');
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
