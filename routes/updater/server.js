var exec = require('child_process').exec;

var rest = require('../../lib/rest');
var helpers = require('./helpers');

rest.get('/updater/server/installed', function(req, res, next) {
  helpers.checkGlobalPerm('read', function(error) {
    if(error) {
      return res.status(403).json({ error: error.message });
    }
    helpers.getPackageVersion(app.configuration.getConfig('serverRoot'), function(error, data) {
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
