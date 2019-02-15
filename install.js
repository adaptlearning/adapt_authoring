var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var optimist = require('optimist');
var path = require('path');
var prompt = require('prompt');
var crypto = require('crypto');

var auth = require('./lib/auth');
var database = require('./lib/database');
var helpers = require('./lib/helpers');
var installHelpers = require('./lib/installHelpers');
var localAuth = require('./plugins/auth/local');
var logger = require('./lib/logger');
var origin = require('./lib/application');

var IS_INTERACTIVE = process.argv.length === 2;
var USE_CONFIG;

var app = origin();
// config for prompt inputs
var inputData;
var masterTenant = false;
var superUser = false;
// from user input
var configResults = {};

installHelpers.checkPrimaryDependencies(function(error) {
  if(error) return handleError(null, 1, error);
  // we need the framework version for the config items, so let's go
  installHelpers.getLatestFrameworkVersion(function(error, latestFrameworkTag) {
    if(error) {
      return handleError(error, 1, 'Failed to get the latest framework version. Check package.json.');
    }
    inputData = {
      useConfigJSON: {
        name: 'useJSON',
        description: 'Use existing config values? y/N',
        type: 'string',
        before: installHelpers.inputHelpers.toBoolean,
        default: 'N'
      },
      startInstall: {
        name: 'install',
        description: 'Continue? Y/n',
        type: 'string',
        before: installHelpers.inputHelpers.toBoolean,
        default: 'Y'
      },
      server: [
        {
          name: 'serverPort',
          type: 'number',
          description: 'Server port',
          pattern: installHelpers.inputHelpers.numberValidator,
          default: 5000
        },
        {
          name: 'serverName',
          type: 'string',
          description: 'Server name',
          default: 'localhost'
        },
        {
          name: 'dataRoot',
          type: 'string',
          description: 'Data directory path',
          pattern: installHelpers.inputHelpers.alphanumValidator,
          default: 'data'
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
          description: 'Specific git revision to be used for the framework. Accepts any valid revision type (e.g. branch/tag/commit)',
          default: 'tags/' + latestFrameworkTag
        }
      ],
      database: {
        dbConfig: [
          {
            name: 'dbName',
            type: 'string',
            description: 'Master database name',
            pattern: installHelpers.inputHelpers.alphanumValidator,
            default: 'adapt-tenant-master'
          },
          {
            name: 'useConnectionUri',
            type: 'string',
            description: "Will you be using a full database connection URI? (all connection options in the URI) y/N",
            before: installHelpers.inputHelpers.toBoolean,
            default: 'N'
          }
        ],
        configureUri: [
          {
            name: 'dbConnectionUri',
            type: 'string',
            description: 'Database connection URI',
            default: ''
          }
        ],
        configureStandard: [
          {
            name: 'dbHost',
            type: 'string',
            description: 'Database host',
            default: 'localhost'
          },
          {
            name: 'dbPort',
            type: 'number',
            description: 'Database server port',
            pattern: installHelpers.inputHelpers.numberValidator,
            default: 27017
          },
          {
            name: 'dbUser',
            type: 'string',
            description: 'Database server user (only specify if using database authentication)',
            pattern: installHelpers.inputHelpers.alphanumValidator,
            default: ''
          },
          {
            name: 'dbPass',
            type: 'string',
            description: 'Database server password (only specify if using database authentication)',
            pattern: installHelpers.inputHelpers.alphanumValidator,
            default: ''
          },
          {
            name: 'dbAuthSource',
            type: 'string',
            description: 'Database server authentication database (only specify if using database authentication)',
            pattern: installHelpers.inputHelpers.alphanumValidator,
            default: ''
          },
        ]
      },
      features: {
        smtp: {
          confirm: {
            name: 'useSmtp',
            type: 'string',
            description: "Will you be using an SMTP server? (used for sending emails) y/N",
            before: installHelpers.inputHelpers.toBoolean,
            default: 'N'
          },
          confirmConnectionUrl: {
            name: 'useSmtpConnectionUrl',
            type: 'string',
            description: "Will you use a URL to connect to your smtp Server y/N",
            before: installHelpers.inputHelpers.toBoolean,
            default: 'N'
          },
          configure: [
            {
              name: 'fromAddress',
              type: 'string',
              description: "Sender email address",
              default: '',
            },
            {
              name: 'rootUrl',
              type: 'string',
              description: "The url this install will be accessible from",
              default: '' // set using default server options
            }
          ],
          configureService: [
            {
              name: 'smtpService',
              type: 'string',
              description: "Which SMTP service (if any) will be used? (see https://github.com/andris9/nodemailer-wellknown#supported-services for a list of supported services.)",
              default: 'none',
            },
            {
              name: 'smtpUsername',
              type: 'string',
              description: "SMTP username",
              default: '',
            },
            {
              name: 'smtpPassword',
              type: 'string',
              description: "SMTP password",
              hidden: true,
              replace: installHelpers.inputHelpers.passwordReplace,
              default: '',
              before: installHelpers.inputHelpers.passwordBefore
            }
          ],
          configureConnectionUrl: [
            {
              name: 'smtpConnectionUrl',
              type: 'string',
              description: "Custom connection URL: smtps://user%40gmail.com:pass@smtp.gmail.com/?pool=true",
              default: 'none',
            }
          ]
        }
      },
      tenant: [
        {
          name: 'masterTenantName',
          type: 'string',
          description: "Set a unique name for your tenant",
          pattern: installHelpers.inputHelpers.alphanumValidator,
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
        before: installHelpers.inputHelpers.toBoolean,
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
          replace: installHelpers.inputHelpers.passwordReplace,
          required: true,
          before: installHelpers.inputHelpers.passwordBefore
        },
        {
          name: 'suRetypePassword',
          type: 'string',
          description: "Confirm Password",
          hidden: true,
          replace: installHelpers.inputHelpers.passwordReplace,
          required: true,
          before: installHelpers.inputHelpers.passwordBefore
        }
      ]
    };
    if(!IS_INTERACTIVE) {
      return start();
    }
    console.log('');
    if(!fs.existsSync('conf/config.json')) {
      fs.ensureDirSync('conf');
      return start();
    }
    console.log('Found an existing config.json file. Do you want to use the values in this file during install?');
    installHelpers.getInput(inputData.useConfigJSON, function(result) {
      console.log('');
      USE_CONFIG = result.useJSON;
      start();
    });
  });
});

// we need the framework version for the config items, so let's go

function generatePromptOverrides() {
  if(USE_CONFIG) {
    var configJson = require('./conf/config.json');
    var configData = JSON.parse(JSON.stringify(configJson).replace(/true/g, '"y"').replace(/false/g, '"n"'));
    configData.install = 'y';
  }
  const sessionSecret = USE_CONFIG && configData.sessionSecret || crypto.randomBytes(64).toString('hex');
  addConfig({ sessionSecret: sessionSecret });
  // NOTE config.json < cmd args
  return Object.assign({}, configData, optimist.argv);
}

function start() {
  // set overrides from command line arguments and config.json
  prompt.override = generatePromptOverrides();
  // Prompt the user to begin the install
  if(!IS_INTERACTIVE || USE_CONFIG) {
    console.log('This script will install the application. Please wait ...');
  } else {
    console.log('This script will install the application. \nWould you like to continue?');
  }
  installHelpers.getInput(inputData.startInstall, function(result) {
    if(!result.install) {
      return handleError(null, 0, 'User cancelled the install');
    }
    async.series([
      configureServer,
      configureDatabase,
      configureFeatures,
      configureMasterTenant,
      createMasterTenant,
      createSuperUser,
      buildFrontend,
      syncMigrations
    ], function(error, results) {
      if(error) {
        console.error('ERROR: ', error);
        return exit(1, 'Install was unsuccessful. Please check the console output.');
      }
      exit(0, `Installation completed successfully, the application can now be started with 'node server'.`);
    });
  });
}

function configureServer(callback) {
  console.log('');
  if(!IS_INTERACTIVE || USE_CONFIG) {
    console.log('Now setting configuration items.');
  } else {
    console.log('We need to configure the tool before install. \nTip: just press ENTER to accept the default value in brackets.');
  }
  installHelpers.getLatestFrameworkVersion(function(error, latestFrameworkTag) {
    if(error) {
      return handleError(error, 1, 'Failed to get latest framework version');
    }
    installHelpers.getInput(inputData.server, function(result) {
      addConfig(result);
      callback();
    });
  });
}

function configureDatabase(callback) {
  installHelpers.getInput(inputData.database.dbConfig, function(result) {
    addConfig(result);

    var isStandard = !result.useConnectionUri || USE_CONFIG && configResults.useConnectionUri !== 'y';
    var config = inputData.database[isStandard ? 'configureStandard' : 'configureUri'];

    installHelpers.getInput(config, function(result) {
      addConfig(result);
      callback();
    });
  });
}

function configureFeatures(callback) {
  async.series([
    function smtp(cb) {
      installHelpers.getInput(inputData.features.smtp.confirm, function(result) {
        addConfig(result);
        if(!result.useSmtp || USE_CONFIG && configResults.useSmtp !== 'y') {
          return cb();
        }
        // prompt user if custom connection url or well-known-service should be used
        installHelpers.getInput(inputData.features.smtp.confirmConnectionUrl, function(result) {
          addConfig(result);
          var smtpConfig;
          if (result.useSmtpConnectionUrl === true) {
            smtpConfig = inputData.features.smtp.configure.concat(inputData.features.smtp.configureConnectionUrl);
          } else {
            smtpConfig = inputData.features.smtp.configure.concat(inputData.features.smtp.configureService);
          }
          for(var i = 0, count = smtpConfig.length; i < count; i++) {
            if(smtpConfig[i].name === 'rootUrl') {
              smtpConfig[i].default = `http://${configResults.serverName}:${configResults.serverPort}`;
            }
          }
          installHelpers.getInput(smtpConfig, function(result) {
            addConfig(result);
            cb();
          });
        });
      });
    }
  ], function() {
    saveConfig(configResults, callback);
  });
}

function configureMasterTenant(callback) {
  var onError = function(error) {
    console.error('ERROR: ', error);
    return exit(1, 'Failed to configure master tenant. Please check the console output.');
  };
  if(!IS_INTERACTIVE || USE_CONFIG) {
    console.log('Now configuring the master tenant. \n');
  } else {
    console.log('Now we need to configure the master tenant. \nTip: just press ENTER to accept the default value in brackets.\n');
  }
  logger.level('console','error');
  // run the app
  app.run({ skipVersionCheck: true, skipDependencyCheck: true });
  app.on('serverStarted', function() {

    if(USE_CONFIG && prompt.override.masterTenantName) {
      /**
      * remove the masterTenantDisplayName, as we can use the existing value
      * (which isn't in config.json so can't be used as an auto override)
      */
      inputData.tenant = inputData.tenant.filter(item => item.name !== 'masterTenantDisplayName');
    }
    installHelpers.getInput(inputData.tenant, function(result) {
      console.log('');
      // add the input to our cached config
      addConfig({
        masterTenant: {
          name: result.masterTenantName,
          displayName: result.masterTenantDisplayName
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
        if(!configResults.masterTenant.displayName) {
          configResults.masterTenant.displayName = tenant.displayName;
        }
        console.log(chalk.yellow(`Tenant '${tenant.name}' already exists. ${chalk.underline('It must be deleted for install to continue.')}`));
        installHelpers.getInput(inputData.tenantDelete, function(result) {
          console.log('');
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
      return handleError(error, 1, 'Failed to create master tenant. Please check the console output.');
    }
    console.log('Master tenant created successfully.');
    masterTenant = tenant;
    delete configResults.masterTenant;
    addConfig(app.configuration.getConfig());
    saveConfig(configResults, callback);
  });
}

function createSuperUser(callback) {
  var onError = function(error) {
    handleError(error, 1, 'Failed to create admin user account. Please check the console output.');
  };
  console.log(`\nNow we need to set up a 'Super Admin' account. This account can be used to manage everything on your ${app.polyglot.t('app.productname')} instance.`);
  installHelpers.getInput(inputData.superUser, function(result) {
    console.log('');
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
      });
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

//As this is a fresh install we dont need to run the migrations so add them to the db and set them to up
function syncMigrations(callback) {
  installHelpers.syncMigrations(function(err, migrations) {
    database.getDatabase(function(err, db) {
      if(err) {
        return callback(err);
      }
      db.update('migration', {}, {'state': 'up'}, callback)
    }, masterTenant._id)
  });
}

// helper functions

function addConfig(newConfigItems) {
  Object.assign(configResults, newConfigItems);
}

/**
 * This will write out the config items both as a config.json file
 *
 * @param {object} configItems
 * @param {callback} callback
 */

function saveConfig(configItems, callback) {
  if (!IS_INTERACTIVE || USE_CONFIG) {
    for (var key in configItems) {
      if (configItems.hasOwnProperty(key) === false) continue;
      var value = configItems[key];
      if (typeof value !== 'string') continue;
      value = value.toLocaleLowerCase();
      if (value === 'y') {
        configItems[key] = true;
      } else if (value === 'n') {
        configItems[key] = false;
      }
    }
  }
  fs.ensureDir('conf', function(error) {
    if (error) {
      return handleError(`Failed to create configuration directory.\n${error}`, 1, 'Install Failed.');
    }
    // Create the final config (with some default values not set in this script)
    const config = Object.assign({
      outputPlugin: 'adapt',
      dbType: 'mongoose',
      auth: 'local',
      root: process.cwd()
    }, configItems);

    fs.writeJson(path.join('conf', 'config.json'), config, { spaces: 2 }, function(error) {
      if(error) {
        return handleError(`Failed to write configuration file to ${chalk.underline('conf/config.json')}.\n${error}`, 1, 'Install Failed.');
      }
      callback();
    });
  });
}

function handleError(error, exitCode, exitMessage) {
  if(error) {
    console.error(`ERROR: ${error}`);
  }
  if(exitCode) {
    exit(exitCode, exitMessage);
  }
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
