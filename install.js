var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var optimist = require('optimist');
var path = require('path');
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
var configOverrides = {};

installHelpers.checkPrimaryDependencies(function(error) {
  if(error) return handleError(null, 1, error);
  // we need the framework version for the config items, so let's go
  installHelpers.getLatestFrameworkVersion(function(error, latestFrameworkTag) {
    if(error) {
      return handleError(error, 1, 'Failed to get the latest framework version. Check package.json.');
    }
    inputData = {
      useConfigJSON: [
        {
          name: 'useJSON',
          message: 'Use existing config values?',
          type: 'confirm',
          default: false
        }
      ],
      startInstall: [
        {
          name: 'install',
          message: 'Continue?',
          type: 'confirm',
          default: true
        }
      ],
      server: [
        {
          name: 'serverPort',
          type: 'number',
          message: 'Server port',
          validate: installHelpers.inputHelpers.numberValidator,
          default: 5000
        },
        {
          name: 'serverName',
          type: 'input',
          message: 'Server name',
          default: 'localhost'
        },
        {
          name: 'dataRoot',
          type: 'input',
          message: 'Data directory path',
          validate: installHelpers.inputHelpers.alphanumValidator,
          default: 'data'
        },
        {
          name: 'authoringToolRepository',
          type: 'input',
          message: 'Git repository URL to be used for the authoring tool source code',
          default: 'https://github.com/adaptlearning/adapt_authoring.git'
        },
        {
          name: 'frameworkRepository',
          type: 'input',
          message: 'Git repository URL to be used for the framework source code',
          default: 'https://github.com/adaptlearning/adapt_framework.git'
        },
        {
          name: 'frameworkRevision',
          type: 'input',
          message: 'Specific git revision to be used for the framework. Accepts any valid revision type (e.g. branch/tag/commit)',
          default: 'tags/' + latestFrameworkTag
        }
      ],
      database: {
        dbConfig: [
          {
            name: 'dbName',
            type: 'input',
            message: 'Master database name',
            validate: installHelpers.inputHelpers.alphanumValidator,
            default: 'adapt-tenant-master'
          },
          {
            name: 'useConnectionUri',
            type: 'confirm',
            message: 'Will you be using a full database connection URI? (all connection options in the URI)',
            default: false
          }
        ],
        configureUri: [
          {
            name: 'dbConnectionUri',
            type: 'input',
            message: 'Database connection URI',
            default: ''
          }
        ],
        configureStandard: [
          {
            name: 'dbHost',
            type: 'input',
            message: 'Database host',
            default: 'localhost'
          },
          {
            name: 'dbPort',
            type: 'number',
            message: 'Database server port',
            validate: installHelpers.inputHelpers.numberValidator,
            default: 27017
          },
          {
            name: 'dbUser',
            type: 'input',
            message: 'Database server user (only specify if using database authentication)',
            validate: installHelpers.inputHelpers.alphanumValidator,
            default: ''
          },
          {
            name: 'dbPass',
            type: 'password',
            message: 'Database server password (only specify if using database authentication)',
            mask: installHelpers.inputHelpers.passwordReplace,
            validate: installHelpers.inputHelpers.alphanumValidator,
            default: ''
          },
          {
            name: 'dbAuthSource',
            type: 'input',
            message: 'Database server authentication database (only specify if using database authentication)',
            validate: installHelpers.inputHelpers.alphanumValidator,
            default: ''
          },
        ]
      },
      features: {
        smtp: {
          confirm: [
            {
              name: 'useSmtp',
              type: 'confirm',
              message: 'Will you be using an SMTP server? (used for sending emails)',
              default: false
            }
          ],
          confirmConnectionUrl: [
            {
              name: 'useSmtpConnectionUrl',
              type: 'confirm',
              message: 'Will you use a URL to connect to your smtp Server',
              default: false
            }
          ],
          configure: [
            {
              name: 'fromAddress',
              type: 'input',
              message: 'Sender email address',
              default: '',
            },
            {
              name: 'rootUrl',
              type: 'input',
              message: 'The url this install will be accessible from',
              default: '' // set using default server options
            }
          ],
          configureService: [
            {
              name: 'smtpService',
              type: 'input',
              message: 'Which SMTP service (if any) will be used? (see https://github.com/andris9/nodemailer-wellknown#supported-services for a list of supported services.)',
              default: 'none',
            },
            {
              name: 'smtpUsername',
              type: 'input',
              message: 'SMTP username',
              default: '',
            },
            {
              name: 'smtpPassword',
              type: 'password',
              message: 'SMTP password',
              mask: installHelpers.inputHelpers.passwordReplace,
              default: ''
            }
          ],
          configureConnectionUrl: [
            {
              name: 'smtpConnectionUrl',
              type: 'input',
              message: 'Custom connection URL: smtps://user%40gmail.com:pass@smtp.gmail.com/?pool=true',
              default: 'none',
            }
          ]
        }
      },
      tenant: [
        {
          name: 'masterTenantName',
          type: 'input',
          message: 'Set a unique name for your tenant',
          validate: installHelpers.inputHelpers.alphanumValidator,
          default: 'master'
        },
        {
          name: 'masterTenantDisplayName',
          type: 'input',
          message: 'Set the display name for your tenant',
          default: 'Master'
        }
      ],
      tenantDelete: [
        {
          name: 'confirm',
          type: 'confirm',
          message: 'Continue?',
          default: true
        }
      ],
      superUser: [
        {
          name: 'suEmail',
          type: 'input',
          message: 'Email address',
          validate: installHelpers.inputHelpers.requiredValidator
        },
        {
          name: 'suPassword',
          type: 'password',
          message: 'Password',
          mask: installHelpers.inputHelpers.passwordReplace,
          validate: installHelpers.inputHelpers.requiredValidator
        },
        {
          name: 'suRetypePassword',
          type: 'password',
          message: 'Confirm Password',
          mask: installHelpers.inputHelpers.passwordReplace,
          validate: installHelpers.inputHelpers.requiredValidator
        }
      ]
    };
    if(!IS_INTERACTIVE) {
      if (installHelpers.inputHelpers.toBoolean(optimist.argv.useJSON)) {
        USE_CONFIG = true;
      }
      return start();
    }
    console.log('');
    if(!fs.existsSync('conf/config.json')) {
      fs.ensureDirSync('conf');
      return start();
    }
    console.log('Found an existing config.json file. Do you want to use the values in this file during install?');
    installHelpers.getInput(inputData.useConfigJSON, configOverrides, function(result) {
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
    var configData = JSON.parse(JSON.stringify(configJson));
    addConfig(configData);
    configData.install = true;
  }
  const sessionSecret = USE_CONFIG && configData.sessionSecret || crypto.randomBytes(64).toString('hex');
  addConfig({ sessionSecret: sessionSecret });
  // NOTE config.json < cmd args
  return Object.assign({}, configData, optimist.argv);
}

function start() {
  // set overrides from command line arguments and config.json
  configOverrides = generatePromptOverrides();
  // Prompt the user to begin the install
  if(!IS_INTERACTIVE || USE_CONFIG) {
    console.log('This script will install the application. Please wait ...');
  } else {
    console.log('This script will install the application. \nWould you like to continue?');
  }
  installHelpers.getInput(inputData.startInstall, configOverrides, function(result) {
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
      installHelpers.runMigrations
    ], function(error, results) {
      if(error) {
        console.error('ERROR: ', error);
        return exit(1, 'Install was unsuccessful. Please check the console output.');
      }
      exit(0, `Installation completed, the application can now be started with 'node server'.`);
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
    installHelpers.getInput(inputData.server, configOverrides, function(result) {
      addConfig(result);
      callback();
    });
  });
}

function configureDatabase(callback) {
  installHelpers.getInput(inputData.database.dbConfig, configOverrides, function(result) {
    addConfig(result);

    var isStandard = !installHelpers.inputHelpers.toBoolean(result.useConnectionUri);
    var config = inputData.database[isStandard ? 'configureStandard' : 'configureUri'];

    installHelpers.getInput(config, configOverrides, function(result) {
      addConfig(result);
      callback();
    });
  });
}

function configureFeatures(callback) {
  async.series([
    function smtp(cb) {
      installHelpers.getInput(inputData.features.smtp.confirm, configOverrides, function(result) {
        addConfig(result);
        if (!installHelpers.inputHelpers.toBoolean(result.useSmtp)) {
          return cb();
        }
        // prompt user if custom connection url or well-known-service should be used
        installHelpers.getInput(inputData.features.smtp.confirmConnectionUrl, configOverrides, function(result) {
          addConfig(result);
          var smtpConfig;
          if (installHelpers.inputHelpers.toBoolean(result.useSmtpConnectionUrl)) {
            smtpConfig = inputData.features.smtp.configure.concat(inputData.features.smtp.configureConnectionUrl);
          } else {
            smtpConfig = inputData.features.smtp.configure.concat(inputData.features.smtp.configureService);
          }
          for(var i = 0, count = smtpConfig.length; i < count; i++) {
            if(smtpConfig[i].name === 'rootUrl') {
              smtpConfig[i].default = `http://${configResults.serverName}:${configResults.serverPort}`;
            }
          }
          installHelpers.getInput(smtpConfig, configOverrides, function(result) {
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

    if(USE_CONFIG && configOverrides.masterTenantName) {
      /**
      * remove the masterTenantDisplayName, as we can use the existing value
      * (which isn't in config.json so can't be used as an auto override)
      */
      inputData.tenant = inputData.tenant.filter(item => item.name !== 'masterTenantDisplayName');
    }
    installHelpers.getInput(inputData.tenant, configOverrides, function(result) {
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
        installHelpers.getInput(inputData.tenantDelete, configOverrides, function(result) {
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
  console.log(`\nNow we need to set up a 'Super Admin' account. This account can be used to manage everything on your authoring tool instance.`);
  installHelpers.getInput(inputData.superUser, configOverrides, function(result) {
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
      console.log(chalk.yellow(`Failed to build the web application, (${error}) \nInstall will continue. Try again after installation completes using 'grunt build:prod'.`));
    }
    callback();
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
