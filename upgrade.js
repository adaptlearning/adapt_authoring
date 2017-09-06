var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var optimist = require('optimist');
var path = require('path');
var prompt = require('prompt');
var semver = require('semver');
var spinner = require('cli-spinner').Spinner;

var logger = require('./lib/logger');
var origin = require('./lib/application');
var installHelpers = require('./installHelpers');

var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';

// GLOBALS
var app = origin();
var spinner = new spinner('');
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
        return checkForUpdates(function(error, updateData) {
          if(error) exit(1, error);

          doUpdate(updateData);
        });
      }
      // no automatic update, so get the intended versions
      prompt.get(tagProperties, function (err, result) {
        doUpdate({
          adapt_authoring: result.authoringToolGitTag,
          adapt_framework: result.frameworkGitTag
        });
      });
    });
  });
}

function doUpdate(data) {
  async.series([
    function(cb) {
      if(!data.adapt_authoring) return cb();
      upgradeAuthoring(data.adapt_authoring, cb);
    },
    function(cb) {
      if(!data.adapt_framework) return cb();
      upgradeFramework(data.adapt_framework, cb);
    },
  ], function (err, results) {
    if (err) {
      console.error('ERROR:', msg);
      return exit(1, 'Upgrade was unsuccessful. Please check the console output.');
    }
    exit(0, `Great work! Your ${app.polyglot.t('app.productname')} is now updated.`);
  });
}

/**
* Queries GitHub
*/
function checkForUpdates(callback) {
  logHeader('Checking for updates');
  var versionData = {};
  async.series([
    function getCurrentVersions(cb) {
      installHelpers.getInstalledVersions(function(error, installedVersionData) {
        versionData.installed = installedVersionData;
        cb(error);
      });
    }
    function getLatestVersions(cb) {
      if (configFile.frameworkRepository) {
        return cb('You are using a custom framework repository, you must use manual upgrade and specify a git tag or branch.');
      }
      installHelpers.getLatestVersions(function(error, latestVersionData) {
        versionData.latest = latestVersionData;
        cb(error);
      });
    }
    function(cb) {
      var updateData = {};
      if (semver.lt(versionData.installed.adapt_authoring, versionData.latest.adapt_authoring)) {
        updateData.adapt_authoring = versionData.latest.adapt_authoring;
        console.log(`${app.polyglot.t('app.productname')} ${versionData.installed.adapt_authoring} installed, ${versionData.latest.adapt_authoring} is available.`);
      }
      if (semver.lt(versionData.installed.adapt_framework, versionData.latest.adapt_framework)) {
        updateData.adapt_framework = versionData.latest.adapt_framework;
        console.log(`Adapt framework ${versionData.installed.adapt_framework} installed, ${versionData.latest.adapt_framework} is available.`);
      }
      if (!updateData.adapt_authoring && !updateData.adapt_framework) {
        return exit(0, `You're already using the latest, no need to upgrade.`);
      }
      cb(null, updateData);
    }
  ], callback);
}

function upgradeAuthoring(revision, callback) {
  logHeader(`Upgrading the ${app.polyglot.t('app.productname')}`);
  installHelpers.updateAuthoring({
    repository: configFile.authoringToolRepository,
    revision: revision
  }, callback);
}

function upgradeFramework(revision, callback) {
  logHeader('Upgrading the Adapt Framework');
  installHelpers.installFramework({
    repository: configFile.frameworkRepository,
    revision: revision
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

function exit(code, msg) {
  code = code || 0;
  msg = msg || 'Bye!';
  console.log('\n' + (code === 0 ? chalk.green(msg) : chalk.red(msg)) + '\n');
  process.exit(code);
}
