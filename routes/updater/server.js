var exec = require('child_process').exec;

var rest = require('../../lib/rest');
var helpers = require('./helpers');

rest.get('/updater/server/installed', function(req, res, next) {
  helpers.checkGlobalPerm('read', function(error) {
    if(error) {
      return res.status(403).json({ error: error.message });
    }
    getInstalledServer(function(error, data) {
      if(error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ installed: data });
    });
  });
});

rest.get('/updater/server/latest', function(req, res, next) {
  helpers.checkGlobalPerm('read', function(error) {
    if(error) {
      return res.status(403).json({ error: error.message });
    }
    helpers.getLatestTag(app.configuration.getConfig('serverRoot'), function(error, data) {
      if(error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ latest: data });
    });
  });
});

function getInstalledServer(cb) {
  // get branch info
  exec('git branch -vv', function(error, execData) {
    var data = {};

    // just pull out the latest for the current branch
    var statusInfo = execData.match(/\* (.+)/)[1];

    var localBranch = statusInfo.match(/(\S+)\s+/)[1];
    statusInfo = statusInfo.replace(localBranch,'');

    var commit = statusInfo.match(/(\S+)/)[1];
    statusInfo = statusInfo.replace(commit,'');

    data.commit = commit;

    var trackingBranchMatch = statusInfo.match(/\[(\S+)(:.+)?\]/);
    if(!trackingBranchMatch) {
      data.branch = localBranch + ' (untracked)';
      return cb(null, data);
    }

    var remoteParts = trackingBranchMatch[1].split('/');
    var remote = remoteParts.splice(0,1);

    data.branch = remoteParts.join('/');

    // get the remote
    exec('git remote get-url ' + remote, function(error, execData) {
      data.repo = execData.replace('\n','');
      cb(null, data);
    });
  });
}
