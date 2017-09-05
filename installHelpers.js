/**
* TODO:
* - does update exist
*/

var _ = require('underscore');
var async = require('async');
var chalk = require('chalk');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var path = require('path');
var request = require('request');

var configFile = fs.readJSONSync(path.join('conf','config.json'));

var FRAMEWORK_ROOT = path.resolve(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework');
var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';

var exports = module.exports = {
  getInstalledServerVersion,
  getLatestServerVersion,
  getInstalledFrameworkVersion,
  getLatestFrameworkVersion,
  getInstalledVersions,
  getLatestVersions
};

function getInstalledServerVersion(callback) {
  try {
    var pkg = fs.readJSONSync('package.json');
    callback(null, pkg.version);
  } catch(e) {
    callback(`Cannot determine authoring tool version, ${e}`);
  }
}

function getLatestServerVersion(callback) {
  checkLatestAdaptRepoVersion('adapt_authoring', callback);
}

function getInstalledFrameworkVersion(callback) {
  try {
    var pkg = fs.readJSONSync(path.join(FRAMEWORK_ROOT, 'package.json'));
    callback(null, pkg.version);
  } catch(e) {
    return callback(`Cannot determine framework version, ${e}`);
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
