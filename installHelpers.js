var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var path = require('path');
var request = require('request');
var semver = require('semver');
var Spinner = require('cli-spinner').Spinner;

var configuration = require('./lib/configuration');

var SILENT = false;
var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';
var DEFAULT_SERVER_REPO = 'https://github.com/adaptlearning/adapt_authoring.git';
var DEFAULT_FRAMEWORK_REPO = 'https://github.com/adaptlearning/adapt_framework.git';
var REMOTE_NAME = 'adapt-origin';

var spinner;

var exports = module.exports = {
  exit,
  showSpinner,
  hideSpinner,
  getInstalledServerVersion,
  getLatestServerVersion,
  getInstalledFrameworkVersion,
  getLatestFrameworkVersion,
  getInstalledVersions,
  getLatestVersions,
  getUpdateData,
  installFramework,
  updateFramework,
  updateFrameworkPlugins,
  updateAuthoring,
  buildAuthoring
};

function exit(code, msg, preCallback) {
  var _exit = function() {
    hideSpinner();
    code = code || 0;
    msg = msg || 'Bye!';
    console.log('\n' + (code === 0 ? chalk.green(msg) : chalk.red(msg)) + '\n');
    process.exit(code);
  }
  if(preCallback) {
    preCallback(_exit);
  } else {
    _exit();
  }
}

function showSpinner(text) {
  spinner = new Spinner(text || '');
  spinner.setSpinnerString(19);
  spinner.start();
}

function hideSpinner() {
  if(spinner) spinner.stop(true);
}

function getInstalledServerVersion(callback) {
  try {
    var pkg = fs.readJSONSync('package.json');
    callback(null, pkg.version);
  } catch(e) {
    callback(`Cannot determine authoring tool version\n${e}`);
  }
}

function getLatestServerVersion(callback) {
  checkLatestAdaptRepoVersion('adapt_authoring', callback);
}

function getInstalledFrameworkVersion(callback) {
  try {
    var pkg = fs.readJSONSync(path.join(getFrameworkRoot(), 'package.json'));
    callback(null, pkg.version);
  } catch(e) {
    return callback(`Cannot determine framework version\n${e}`);
  }
}

function getLatestFrameworkVersion(callback) {
  checkLatestAdaptRepoVersion('adapt_framework', callback);
}

function getInstalledVersions(callback) {
  async.parallel([
    exports.getInstalledServerVersion,
    exports.getInstalledFrameworkVersion
  ], function(error, results) {
    callback(error, {
      adapt_authoring: results[0],
      adapt_framework: results[1]
    });
  });
}

function getLatestVersions(callback) {
  async.parallel([
    exports.getLatestServerVersion,
    exports.getLatestFrameworkVersion
  ], function(error, results) {
    callback(error, {
      adapt_authoring: results[0],
      adapt_framework: results[1]
    });
  });
}

function getUpdateData(callback) {
  async.parallel([
    exports.getInstalledVersions,
    exports.getLatestVersions
  ], function(error, results) {
    if(error) {
      return callback(error);
    }
    var updateData = {};
    if(semver.lt(results[0].adapt_authoring, results[1].adapt_authoring)) {
      updateData.adapt_authoring = results[1].adapt_authoring;
    }
    if(semver.lt(results[0].adapt_framework, results[1].adapt_framework)) {
      updateData.adapt_framework = results[1].adapt_framework;
    }
    if(_.isEmpty(updateData)) {
      return callback();
    }
    callback(null, updateData);
  });
}

function getFrameworkRoot() {
  return path.join(configuration.serverRoot, 'temp', configuration.getConfig('masterTenantID'), 'adapt_framework');
}

/**
* Checks all releases for the latest to match framework value in config.json
* Recusion required for pagination.
*/
function checkLatestAdaptRepoVersion(repoName, callback) {
  // used in pagination
  var nextPage = `https://api.github.com/repos/adaptlearning/${repoName}/releases`;

  var _getReleases = function(done) {
    request({
      headers: {
        'User-Agent': DEFAULT_USER_AGENT ,
        Authorization: 'token 15e160298d59a7a70ac7895c9766b0802735ac99'
      },
      uri: nextPage,
      method: 'GET'
    }, done);
  };
  var _requestHandler = function(error, response, body) {
    // we've exceeded the API limit
    if(response.statusCode === 403 && response.headers['x-ratelimit-remaining'] === '0') {
      var reqsReset = new Date(response.headers['x-ratelimit-reset']*1000);
      error = `You have exceeded GitHub's request limit of ${response.headers['x-ratelimit-limit']} requests per hour. Please wait until at least ${reqsReset.toTimeString()} before trying again.`;
    }
    else if (response.statusCode !== 200) {
      error = 'GitubAPI did not respond with a 200 status code.';
    }

    if (error) {
      return callback(`Couldn't check latest version of ${repoName}\n${error}`);
    }
    nextPage = parseLinkHeader(response.headers.link).next;
    try {
      var releases = JSON.parse(body);
    } catch(e) {
      return callback(`Failed to parse GitHub release data\n${e}`);
    }
    var compatibleRelease;
    var frameworkVersion = configuration.getConfig('framework');
    if(!frameworkVersion) {
      return callback(null, releases[0].tag_name);
    }
    async.someSeries(releases, function(release, cb) {
      var isFullRelease = !release.draft && !release.prerelease;
      if(isFullRelease && semver.satisfies(release.tag_name, frameworkVersion)) {
        compatibleRelease = release;
        return cb(null, true);
      }
      cb(null, false);
    }, function(error, satisfied) {
      if(!satisfied) {
        if(nextPage) {
          return _getReleases(_requestHandler);
        }
        error = `Couldn't find any releases compatible with specified framework version (${frameworkVersion}), please check that it is a valid version.`;
      }
      if(error) {
        return callback(error);
      }
      callback(error, compatibleRelease.tag_name);
    });
  };
  // start recursion
  _getReleases(_requestHandler);
}

// taken from https://gist.github.com/niallo/3109252
function parseLinkHeader(header) {
  if (header.length === 0) {
    throw new Error("input must not be of zero length");
  }
  var links = {};
  // Parse each part into a named link
  _.each(header.split(','), function(p) {
    var section = p.split(';');
    if (section.length !== 2) {
      throw new Error("section could not be split on ';'");
    }
    var url = section[0].replace(/<(.*)>/, '$1').trim();
    var name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  });
  return links;
}

/**
* Clones/updates the temp/ framework folder
* Accepts the following options: {
*   repository: URL to pull framework from,
*   revision: in the format tags/[TAG] or remote/[BRANCH],
*   force: forces a clone regardless of whether we have an existing clone,
* }
*/
function installFramework(opts, callback) {
  if(arguments.length !== 2 || !opts.directory) {
    return callback('Cannot install framework, invalid options passed.');
  }
  if(!opts.repository) {
    opts.repository = DEFAULT_FRAMEWORK_REPO;
  }
  if(!opts.revision) {
    return getLatestFrameworkVersion(function(error, version) {
      if(error) return callback(error);
      installFramework(_.extend(opts, { revision: version }), callback);
    });
  }
  if(!fs.existsSync(opts.directory) || opts.force) {
    return async.applyEachSeries([
      cloneRepo,
      updateFramework
    ], opts, callback);
  }
  async.applyEachSeries([
    fetchRepo,
    updateFramework
  ], opts, callback);
}

function updateFramework(opts, callback) {
  updateRepo(opts, function(error) {
    if(error) {
      return callback(error)
    }
    async.applyEach([
      purgeCourseFolder,
      updateFrameworkPlugins
    ], opts, callback);
  });
}

function cloneRepo(opts, callback) {
  if(arguments.length !== 2) {
    return callback('Cannot clone repository, invalid options passed.');
  }
  if(!opts.repository) {
    return callback('Cannot clone repository, no repository specified.');
  }
  if(!opts.directory) {
    return callback(`Cannot clone ${opts.repository}, no target directory specified.`);
  }
  showSpinner(`Cloning ${opts.repository}`);
  fs.remove(opts.directory, function(error) {
    if(error) {
      hideSpinner();
      return callback(error);
    }
    execCommand(`git clone ${opts.repository} --origin ${REMOTE_NAME} ${opts.directory}`, function(error) {
      hideSpinner();
      if(error) {
        return callback(error);
      }
      log(`Cloned ${opts.repository} successfully.`);
      callback();
    });
  })
}

function fetchRepo(opts, callback) {
  if(arguments.length !== 2) {
    return callback('Cannot fetch repository, invalid options passed');
  }
  if(!opts.repository) {
    return callback('Cannot fetch repository, repository URL not specified');
  }
  if(!opts.directory) {
    return callback(`Cannot fetch ${opts.repository}, target directory not specified`);
  }
  execCommand(`git remote set-url ${REMOTE_NAME} ${opts.repository} && git fetch ${REMOTE_NAME}`, {
    cwd: opts.directory
  }, callback);
}

function updateRepo(opts, callback) {
  if(arguments.length !== 2) {
    return callback('Cannot update repository, invalid options passed');
  }
  if(!opts.directory) {
    return callback('Cannot update repository, target directory not specified.');
  }
  if(!opts.revision) {
    return callback(`Cannot update ${opts.repository}, revision not specified.`);
  }
  var shortDir = opts.directory.replace(configuration.serverRoot, '');
  showSpinner(`Updating ${shortDir} to ${opts.revision}`);
  execCommand(`git reset --hard ${opts.revision}`, {
    cwd: opts.directory
  }, function(error) {
    hideSpinner();
    if (error) {
      return callback(error);
    }
    log(`Updated ${shortDir} to ${opts.revision}`);
    callback();
  });
}

/**
* Uses adapt.json to install the latest plugin versions
*/
function updateFrameworkPlugins(opts, callback) {
  if(arguments.length !== 2) {
    return callback('Cannot update Adapt framework plugins, invalid options passed.');
  }
  if(!opts.directory) {
    return callback('Cannot update Adapt framework plugins, no target directory specified.');
  }
  fs.readJSON(path.join(opts.directory, 'adapt.json'), function(error, json) {
    if (error) {
      return callback(error);
    }
    var plugins = Object.keys(json.dependencies);
    async.eachSeries(plugins, function(plugin, pluginCallback) {
      var _done = function() {
        hideSpinner();
        pluginCallback.apply(this, arguments);
      };
      showSpinner(`Updating Adapt framework plugin '${plugin}'`);
      if(json.dependencies[plugin] === '*') {
        app.bowermanager.installLatestCompatibleVersion(plugin, _done);
      } else {
        app.bowermanager.installPlugin(plugin, json.dependencies[plugin], _done);
      }
    }, function(error) {
      hideSpinner();
      if(error) {
        return callback(error);
      }
      log('Adapt framework plugins updated.');
      callback();
    });
  });
}

/**
* This isn't used by the authoring tool
*/
function purgeCourseFolder(opts, callback) {
  if(arguments.length !== 2) {
    return callback('Cannot remove course folder, invalid options passed.');
  }
  if(!opts.directory) {
    return callback('Cannot remove course folder, no target directory specified.');
  }
  fs.remove(path.join(opts.directory, 'src', 'course'), callback);
}

function updateAuthoring(opts, callback) {
  if(!opts.revision) {
    return callback('Cannot update server, revision not specified.');
  }
  if(!opts.repository) {
    opts.repository = DEFAULT_SERVER_REPO;
  }
  async.series([
    function fetchLatest(cb) {
      fetchRepo(opts, cb);
    },
    function pullLatest(cb) {
      updateRepo(opts, cb);
    },
    function installDeps(cb) {
      installDependencies(cb);
    },
    function rebuildApp(cb) {
      buildAuthoring(cb);
    }
  ], function(error) {
    if(!error) {
      log(`Server has been updated successfully!`);
    }
    callback(error);
  });
}

function buildAuthoring(callback) {
  showSpinner('Building web application');
  execCommand('grunt build:prod', function(error){
    hideSpinner();
    if(error) {
      return callback(error);
    }
    log('Web application built successfully.');
    callback();
  });
}

function installDependencies(dir, callback) {
  if(arguments.length === 1) {
    callback = dir;
  }
  showSpinner(`Installing node dependencies`);

  execCommand('npm install', {
    cwd: dir || configuration.serverRoot
  }, function(error) {
    hideSpinner();
    if(error) {
      return callback(error);
    }
    log('Node dependencies installed successfully.');
    callback();
  });
}

function execCommand(cmd, opts, callback) {
  if(arguments.length === 2) {
    callback = opts;
    opts = {};
  }
  var child = exec(cmd, _.extend({ stdio: [0, 'pipe', 'pipe'] }, opts));
  // child.stdout.on('data', log);
  // child.stderr.on('data', log);
  child.on('exit', callback);
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
