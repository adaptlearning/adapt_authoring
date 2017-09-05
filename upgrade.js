var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var optimist = require('optimist');
var path = require('path');
var prompt = require('prompt');
var request = require('request');
var rimraf = require('rimraf');
var spinner = require('cli-spinner').Spinner;

var logger = require('./lib/logger');
var origin = require('./lib/application');

var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';
var FRAMEWORK_ROOT;
var REMOTE_NAME = 'adaptlearning';
var SILENT = false;

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
  FRAMEWORK_ROOT = path.resolve(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework');
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
  log(`\nThis script will update the ${app.polyglot.t('app.productname')} and/or Adapt Framework. Would you like to continue?`);
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
    upgradeFramework,
    upgradeFrameworkPlugins
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
  try {
    var authoringPackage = fs.readJSONSync('package.json');
    installedAuthoringVersion = authoringPackage.version;
    installedAuthoringVersion = 0.2;
  } catch(e) {
    return callback(`Cannot determine authoring tool version, ${e}`);
  }
  try {
    var framworkPackage = fs.readJSONSync(path.join(FRAMEWORK_ROOT, 'package.json'));
    installedFrameworkVersion = framworkPackage.version;
    installedFrameworkVersion = 2.0;
  } catch(e) {
    return callback(`Cannot determine framework version, ${e}`);
  }
  // set the repo URLs if not specified
  if(typeof configFile.authoringToolRepository === 'undefined'){
    configFile.authoringToolRepository = 'https://github.com/adaptlearning/adapt_authoring.git';
  }
  if(typeof configFile.frameworkRepository === 'undefined'){
    configFile.frameworkRepository = 'https://github.com/adaptlearning/adapt_framework.git';
  }
  log(`- ${app.polyglot.t('app.productname')}: ${installedAuthoringVersion}`);
  log(`- Adapt Framework: ${installedFrameworkVersion}`);
  callback();
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
  if (configFile.frameworkRepository !== 'https://github.com/adaptlearning/adapt_framework.git') {
    return callback('You are using a custom framework repository, you must use manual upgrade and specify a git tag or branch.');
  }
  // no versions specified, check for the latest
  checkLatestAdaptRepoVersion('adapt_authoring', function(error, version) {
    if(error) return cb(error);
    latestAuthoringTag = version;
    checkLatestAdaptRepoVersion('adapt_framework', function(error, version) {
      if(error) return cb(error);
      latestFrameworkTag = version;
      checkIfUpdateNeeded(function() {
        callback();
      });
    });
  });
}

function checkLatestAdaptRepoVersion(repoName, callback) {
  request({
    headers: { 'User-Agent': DEFAULT_USER_AGENT },
    uri: `https://api.github.com/repos/adaptlearning/${repoName}/releases/latest`,
    method: 'GET'
  }, function(error, response, body) {
    if (response.statusCode !== 200) {
      error = 'GitubAPI did not respond with a 200 status code';
    }
    if (error) {
      return callback(`Couldn't check latest version of ${repoName}, ${error}`);
    }
    try {
      var version = JSON.parse(body).tag_name;
    } catch(e) {
      return callback(`Couldn't check latest version of ${repoName}, ${e}`);
    }
    callback(null, version);
  });
}

function checkIfUpdateNeeded(callback) {
  if (latestAuthoringTag != installedAuthoringVersion) {
    shouldUpdateAuthoring = true;
    log(`Update for ${app.polyglot.t('app.productname')} is available: ${latestAuthoringTag}`);
  }
  if (latestFrameworkTag != installedFrameworkVersion) {
    shouldUpdateFramework = true;
    log(`Update for Adapt Framework is available: ${latestFrameworkTag}`);
  }
  // If neither need updating then quit the upgrading process
  if (!shouldUpdateFramework && !shouldUpdateAuthoring) {
    return exit(0, `You're already using the latest, no need to upgrade.`);
  }
  callback();
}

function execCommand(cmd, opts, callback) {
  if(arguments.length === 2) {
    callback = opts;
    opts = {};
  }
  var child = exec(cmd, _.extend({ stdio: [0, 'pipe', 'pipe'] }, opts));
  child.stdout.on('data', function(err) {
    logError(err);
  });
  child.stderr.on('data', function(err) {
    logError(err);
  });
  child.on('exit', callback);
}

function upgradeAuthoring(callback) {
  if (!shouldUpdateAuthoring) {
    return callback();
  }
  logHeader(`Upgrading the ${app.polyglot.t('app.productname')}`);
  async.series([
    function fetchLatest(cb) {
      log('Fetching latest changes');
      execCommand(`git remote set-url ${REMOTE_NAME} ${configFile.authoringToolRepository} && git fetch ${REMOTE_NAME}`, cb);
    },
    function pullLatest(cb) {
      log('Pulling latest changes');
      var isTag = latestAuthoringTag.includes('tags') || upgradeOptions.automatic;
      var tagName = upgradeOptions.authoringToolGitTag || latestAuthoringTag;
      execCommand(`git reset --hard ${isTag ? 'tags' : REMOTE_NAME}/${tagName}`, cb);
    },
    function installDeps(cb) {
      log(`Installing ${app.polyglot.t('app.productname')} dependencies`);
      exec('npm install', cb);
    },
    function rebuildApp(cb) {
      log('Building front-end');
      execCommand('grunt build:prod', cb);
    },
    function updateVersion(cb) {
      log(`${app.polyglot.t('app.productname')} has been updated`);
      cb();
    }
  ], callback);
}

function upgradeFramework(callback) {
  // Upgrade Framework if we need to
  if (!shouldUpdateFramework) {
    return callback();
  }
  logHeader('Upgrading the Adapt Framework');
  var fwOpts = {
    cwd: path.resolve('temp', configFile.masterTenantID, 'adapt_framework')
  };
  async.series([
    function fetchLatest(cb) {
      execCommand(`git remote set-url ${REMOTE_NAME} ${configFile.frameworkRepository} && git fetch ${REMOTE_NAME}`, fwOpts, cb);
    },
    function pullLatest(cb) {
      log('Fetch from Git was successful.');
      log('Pulling latest changes...');
      var isTag = latestFrameworkTag.includes('tags') || !upgradeOptions.automatic;
      var tagName = upgradeOptions.frameworkGitTag || latestFrameworkTag;
      execCommand(`git reset --hard ${isTag ? 'tags' : REMOTE_NAME}/${tagName} && npm install`, fwOpts, cb);
    },
    function removeDefaultCourse(cb) {
      log('Framework has been updated.\n');
      rimraf(path.resolve(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework', 'src', 'course'), cb);
    }
  ], callback);
}

/**
* Uses adapt.json to install the latest plugin versions
*/
function upgradeFrameworkPlugins(callback) {
  if (!shouldUpdateFramework) {
    return callback();
  }
  fs.readJSON(path.join(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework', 'adapt.json'), function(err, json) {
    if (err) {
      return callback(err);
    }
    var plugins = Object.keys(json.dependencies);
    async.eachSeries(plugins, function(plugin, pluginCallback) {
      if(json.dependencies[plugin] === '*') {
        app.bowermanager.installLatestCompatibleVersion(plugin, pluginCallback);
      } else {
        app.bowermanager.installPlugin(plugin, json.dependencies[plugin], pluginCallback);
      }
    }, callback);
  });
}

function showSpinner() {
  spinner.start();
}

function hideSpinner() {
  spinner.stop(true);
}

function log(msg) {
  if(!SILENT) console.log(msg);
}

function logHeader(msg) {
  if(!SILENT) console.log(chalk.underline(`\n${msg}`));
}

function logError(msg) {
  if(!SILENT) console.error('ERROR:', msg);
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
  log('\n' + (code === 0 ? chalk.green(msg) : chalk.red(msg)) + '\n');
  process.exit(code);
}
