// NPM includes
var exec = require('child_process').exec;
var fs = require('fs-extra');
var path = require('path');
var semver = require('semver');
// local includes
var origin = require('../../lib/application')();
var OutputConstants = require('../../lib/outputmanager').Constants;
var permissions = require('../../lib/permissions');

var exports = module.exports = {
  checkGlobalPerm: function(action, cb) {
    var currentUser = origin.usermanager.getCurrentUser();
    var resource = permissions.buildResourceString('*', '*');
    permissions.hasPermission(currentUser._id, action, resource, function(error, hasPermission) {
      if(error) return cb(error);
      if(!hasPermission) return cb(new Error('You don\'t have the correct permissions to do that!'));
      cb();
    });
  },
  compareVersions: function(a, b) {
    if(!semver.valid(a)) return -1;
    if(!semver.valid(b)) return 1;
    if(semver.lt(a,b)) return -1;
    if(semver.gt(a,b)) return 1;
    return 0;
  },
  getFrameworkDir: function() {
    return path.join(
      OutputConstants.Folders.Temp,
      origin.usermanager.getCurrentUser().tenant._id,
      OutputConstants.Folders.Framework
    );
  },
  getPackageVersion(repoDir, cb) {
    // TODO maybe use a contant for package.json
    var packagePath = path.join(repoDir, 'package.json');
    fs.readJson(packagePath, function(error, packageObj) {
      cb(error, packageObj.version);
    });
  },

  getLatestTag(repoDir, cb) {
    exec("git fetch origin --tags", { cwd: repoDir }, function(error, data) {
      if(error) return cb(error);
      exec("git tag", { cwd: repoDir }, function(error, data) {
        if(error) return cb(error);
        var tags = data.split('\n').sort(exports.compareVersions);
        // remove the 'v' prefix if there is one, and give a good trim
        cb(null, tags.pop().replace('v', '').trim());
      });
    });
  }
}
