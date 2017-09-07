var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var optimist = require('optimist');
var path = require('path');
var prompt = require('prompt');
var semver = require('semver');
var Spinner = require('cli-spinner').Spinner;

var configuration = require('./lib/configuration');
var logger = require('./lib/logger');
var origin = require('./lib/application');
var OutputConstants = require('./lib/outputmanager').Constants;
var installHelpers = require('./installHelpers');

var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';

// GLOBALS
var app = origin();
var spinner;

/**
* Start of execution
*/
start();

function start() {
  // don't show any logger messages in the console
  logger.level('console','error');
  // start the server first
  app.run({ skipVersionCheck: true, skipStartLog: true });
  app.on('serverStarted', getUserInput);
}

function getUserInput() {
  // properties for the prompts
  var confirmProperties = {
    name: 'Y/n',
    type: 'string',
    default: 'Y'
  };
  var upgradeProperties = {
    properties: {
      updateAutomatically: {
        description: 'Update automatically',
        type: 'string',
        default: 'Y'
      }
    }
  };
  var tagProperties = {
    properties: {
      authoringToolGitTag: {
        type: 'string',
        required: true,
        description: 'Authoring Tool git revision (enter branch name or tag as tags/[tagname])'
      },
      frameworkGitTag: {
        type: 'string',
        required: true,
        description: 'Framework git revision (enter branch name or tag as tags/[tagname])'
      }
    }
  };
  console.log(`\nThis script will update the ${app.polyglot.t('app.productname')} and/or Adapt Framework. Would you like to continue?`);
  prompt.override = optimist.argv;
  prompt.start();
  prompt.get(confirmProperties, function(error, result) {
    if(error) {
      return exit(1, error);
    }
    if(!/(Y|y)[es]*$/.test(result['Y/n'])) {
      return exit();
    }
    prompt.get(upgradeProperties, function(error, result) {
      if(error) {
        return exit(1, error);
      }
      console.log('');
      if(result['updateAutomatically'] === 'Y' || result['updateAutomatically'] === 'y') {
        return checkForUpdates(function(error, updateData) {
          if(error) {
            return exit(1, error);
          }
          doUpdate(updateData);
        });
      }
      // no automatic update, so get the intended versions
      prompt.get(tagProperties, function(error, result) {
        if(error) exit(1, error);
        doUpdate({
          adapt_authoring: result.authoringToolGitTag,
          adapt_framework: result.frameworkGitTag
        });
      });
    });
  });
}

function checkForUpdates(callback) {
  showSpinner('Checking for updates');
  var versionData = {};
  installHelpers.getUpdateData(function(error, data) {
    hideSpinner();
    if(!data) {
      return exit(0, `Your software is already up-to-date, no need to upgrade.`);
    }
    console.log(chalk.underline('Software updates found.\n'));
    callback(null, data);
  });
}

function doUpdate(data) {
  async.series([
    function upgradeAuthoring(cb) {
      if(!data.adapt_authoring) {
        return cb();
      }
      showSpinner(`Upgrading the ${app.polyglot.t('app.productname')} to ${data.adapt_authoring}`);
      installHelpers.updateAuthoring({
        repository: configuration.getConfig('authoringToolRepository'),
        revision: data.adapt_authoring
      }, cb);
    },
    function upgradeFramework(cb) {
      hideSpinner();
      console.log(`${app.polyglot.t('app.productname')} upgraded to ${data.adapt_authoring}`);
      if(!data.adapt_framework) {
        return cb();
      }
      showSpinner(`Upgrading the Adapt framework to ${data.adapt_framework}`);
      installHelpers.installFramework({
        repository: configuration.getConfig('frameworkRepository'),
        revision: data.adapt_framework,
        directory: path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), OutputConstants.Folders.Framework)
      }, cb);
    },
  ], function(error, results) {
    hideSpinner();
    if(error) {
      console.error('ERROR:', msg);
      return exit(1, 'Upgrade was unsuccessful. Please check the console output.');
    }
    console.log(`Adapt framework upgraded to ${data.adapt_framework}`);
    exit(0, `Your ${app.polyglot.t('app.productname')} was updated successfully.`);
  });
}

function showSpinner(text) {
  spinner = new Spinner(text || '');
  spinner.setSpinnerString(19);
  spinner.start();
}

function hideSpinner() {
  if(spinner) spinner.stop(true);
}

function logHeader(msg) {
  console.log(chalk.underline(`\n${msg}`));
}

function exit(code, msg) {
  hideSpinner();
  code = code || 0;
  msg = msg || 'Bye!';
  console.log('\n' + (code === 0 ? chalk.green(msg) : chalk.red(msg)) + '\n');
  process.exit(code);
}
