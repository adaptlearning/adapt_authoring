/**
* TODO:
* - support any remote name
* - look at consistent error logging/callbacks (we'd ideally bubble these all up to the main func rather than exiting early)
*/

var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var optimist = require('optimist');
var path = require('path');
var prompt = require('prompt');
var spinner = require('cli-spinner').Spinner;

var logger = require('./lib/logger');
var origin = require('./lib/application');
var installHelpers = require('./installHelpers');

var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';

// GLOBALS
var app = origin();
var spinner = new spinner('');
var installedAuthoringVersion = '';
var latestAuthoringTag = null;
var installedFrameworkVersion = '';
var latestFrameworkTag = null;
var shouldUpdateAuthoring = false;
var shouldUpdateFramework = false;
var upgradeOptions = {
  automatic: true
};
var configFile;
/**
* Start of execution
*/
start();

function start() {
  configFile = fs.readJSONSync(path.join('conf','config.json'));
  // don't show any logger messages in the console
  logger.level('console','error');

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
  prompt.get(confirmProperties, function (err, result) {
    if(err) {
      return exit(1, err);
    }
    if (!/(Y|y)[es]*$/.test(result['Y/n'])) {
      return exit();
    }
    prompt.get(upgradeProperties, function (err, result) {
      if(err) {
        return exit(1, err);
      }
      if (result['updateAutomatically'] === 'Y' || result['updateAutomatically'] === 'y') {
        return doSteps();
      }
      // no automatic update, so get the intended versions
      upgradeOptions.automatic = false;
      prompt.get(tagProperties, function (err, result) {
        upgradeOptions.authoringToolGitTag = result.authoringToolGitTag;
        upgradeOptions.frameworkGitTag = result.frameworkGitTag;
        doSteps();
      });
    });
  });
}

function doSteps() {
  async.series([
    checkInstalledVersions,
    checkLatestVersions,
    upgradeAuthoring,
    upgradeFramework
  ], function (err, results) {
    if (err) {
      logError(err);
      return exit(1, 'Upgrade was unsuccessful. Please check the console output.');
    }
    exit(0, `Great work! Your ${app.polyglot.t('app.productname')} is now updated.`);
  });
}

/**
* Queries GitHub
*/
function checkInstalledVersions(callback) {
  logHeader('Checking installed versions');
  installHelpers.getInstalledVersions(function(error, versionData) {
    if(error) {
      return callback(error);
    }
    installedAuthoringVersion = versionData.adapt_authoring;
    installedFrameworkVersion = versionData.adapt_framework;
    console.log(`- ${app.polyglot.t('app.productname')}: ${installedAuthoringVersion}`);
    console.log(`- Adapt Framework: ${installedFrameworkVersion}`);
    callback();
  });
}

function checkLatestVersions(callback) {
  logHeader('Checking for updates');
  // we're installing specific versions, return early
  if (!upgradeOptions.automatic) {
    shouldUpdateAuthoring = true;
    shouldUpdateFramework = true;
    latestAuthoringTag = upgradeOptions.authoringToolGitTag;
    latestFrameworkTag = upgradeOptions.frameworkGitTag;
    return callback();
  }
  if (configFile.frameworkRepository) {
    return callback('You are using a custom framework repository, you must use manual upgrade and specify a git tag or branch.');
  }
  // no versions specified, check for the latest
  installHelpers.getLatestVersions(function(error, versions) {
    latestAuthoringTag = versions.adapt_authoring;
    latestFrameworkTag = versions.adapt_framework;
    checkIfUpdateNeeded(callback);
  });
}

function checkIfUpdateNeeded(callback) {
  if (latestAuthoringTag !== installedAuthoringVersion) {
    shouldUpdateAuthoring = true;
    console.log(`Update for ${app.polyglot.t('app.productname')} is available: ${latestAuthoringTag}`);
  }
  if (latestFrameworkTag !== installedFrameworkVersion) {
    shouldUpdateFramework = true;
    console.log(`Update for Adapt Framework is available: ${latestFrameworkTag}`);
  }
  // If neither need updating then quit the upgrading process
  if (!shouldUpdateFramework && !shouldUpdateAuthoring) {
    return exit(0, `You're already using the latest, no need to upgrade.`);
  }
  callback();
}

function upgradeAuthoring(callback) {
  if (!shouldUpdateAuthoring) {
    return callback();
  }
  logHeader(`Upgrading the ${app.polyglot.t('app.productname')}`);
  installHelpers.updateAuthoring({
    repository: configFile.authoringToolRepository,
    revision: upgradeOptions.authoringToolGitTag
  }, callback);
}

function upgradeFramework(callback) {
  if (!shouldUpdateFramework) {
    return callback();
  }
  logHeader('Upgrading the Adapt Framework');
  installHelpers.installFramework({
    repository: configFile.frameworkRepository,
    revision: upgradeOptions.frameworkGitTag
  }, callback);
}

function showSpinner() {
  spinner.start();
}

function hideSpinner() {
  spinner.stop(true);
}

function logHeader(msg) {
  console.log(chalk.underline(`\n${msg}`));
}

function logError(msg) {
  console.error('ERROR:', msg);
}

/**
* Exits the install with some cleanup, should there be an error
*
* @param {int} code
* @param {string} msg
*/
function exit(code, msg) {
  code = code || 0;
  msg = msg || 'Bye!';
  console.log('\n' + (code === 0 ? chalk.green(msg) : chalk.red(msg)) + '\n');
  process.exit(code);
}
