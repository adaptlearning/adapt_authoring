// NPM includes
var _ = require('underscore');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var path = require('path');
var rest = require('../../lib/rest');
// export needed by router.js
var server = module.exports = require('express')();
// local includes
var origin = require('../../lib/application')();
var OutputConstants = require('../../lib/outputmanager').Constants;

server.get('/systemInfo', function (req, res, next) {
  async.parallel([
    function framework(cb) {
      getFrameworkData(cb);
    },
    function server(cb) {
      getServerData(cb);
    }
  ], function(error, data) {
    if(error) return next(error);
    // concat all data
    res.status(200).json(_.reduce(data, function(memo, item) { return _.extend(memo, item); }, {}));
  });
});

function getFrameworkData(cb) {
  var packagePath = path.join(
    OutputConstants.Folders.Temp,
    origin.usermanager.getCurrentUser().tenant._id,
    OutputConstants.Folders.Framework,
    OutputConstants.Filenames.Package
  );
  fs.readJson(packagePath, function(error, packageObj) {
    cb(error, {
      'Framework Version': packageObj.version
    });
  });
}

function getServerData(cb) {
  // get branch info
  var child = exec("git branch -vv", function(error, stdout, stderr) {
    if(error) return cb(error);
    if (stderr.length !== 0) return cb(stderr);
    if (stdout.length === 0) return cb(null, {});

    var elements = stdout.match(/\* (.+)/)[1].match(/\S+/g);
    var commit = elements[1];
    var remoteInfo = elements[2].substr(1,elements[2].length-2).split('/');
    var remote = remoteInfo[0];
    var branch = remoteInfo[1]; // use the remote branch name in case local is different
    // get the remote
    child = exec("git remote get-url " + remote, function(error, stdout, stderr) {
      if(error) return cb(error);
      if (stderr.length != 0) return cb(stderr);
      if (stdout.length === 0) return cb(null, {});

      cb(null, {
        'Origin Version': commit,
        'Origin Branch': branch,
        'Origin Repository': stdout.replace('\n','')
      });
    });

  });
}
