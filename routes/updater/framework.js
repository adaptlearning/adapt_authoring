// NPM includes
var async = require('async');
var fs = require('fs-extra');
var path = require('path');
var childProcess = require('child_process');
var semver = require('semver');
// local includes
var database = require('../../lib/database');
var FOLDERS = require('../../lib/outputmanager').Constants.Folders;
var logger = require('../../lib/logger');
var origin = require('../../lib/application')();
var rest = require('../../lib/rest');

var helpers = require('./helpers');

rest.get('/updater/framework/installed', function(req, res, next) {
  helpers.checkGlobalPerm('read', function(error) {
    if(error) {
      return res.status(500).json({ error: error.message });
    }
    helpers.getPackageVersion(helpers.getFrameworkDir(), function(error, data) {
      if(error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ latest: data });
    });
  });
});

rest.get('/updater/framework/latest', function(req, res, next) {
  helpers.checkGlobalPerm('read', function(error) {
    if(error) {
      return res.status(500).json({ error: error.message });
    }
    helpers.getLatestTag(helpers.getFrameworkDir(), function(error, data) {
      if(error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ latest: data });
    });
  });
});

rest.put('/updater/framework/update', function(req, res, next) {
  helpers.checkGlobalPerm('update', function(error) {
    if(error) {
      return res.status(500).json({ error: error.message });
    }
    if(!semver.valid(req.body.version)) {
      return res.status(400).json({ error: 'Invalid version specified \'' + req.body.version + '\'' });
    }
    updateFramework(req.body.version, function(error) {
      if(error) {
        logger.log('error', error);
        return res.status(500).json({ error: error });
      }
      // TODO do we need to verify this?
      res.status(200).json({ installed: req.body.version });
    });
  });
});

function exec(task, cb) {
  childProcess.exec(task, { cwd: helpers.getFrameworkDir() }, function(error, stdout, stderr) {
    if(error) return cb(error);
    if (stderr.length !== 0) return cb(stderr);
    return cb(null, stdout);
  });
}

function updateFramework(version, cb) {
  logger.log('info', 'Attempting to framework update to ' + version);
  updateGit(version, function(error) {
    async.parallel([
      removeCourse,
      npmInstall,
      adaptInstall,
      copyCustomPlugins,
      writeBuildFlags
    ], function doneParallel(error) {
      if(error) return cb(error);
      updateVersionJson(version, function(error) {
        if(error) return cb(error);
        logger.log('info', 'Framework successfully updated to ' + version);
        cb();
      });
    });
  });
}

function updateGit(version, cb) {
  exec("git fetch origin", function(error) {
    if(error) return cb(error);
    if(version[0] !== 'v') version = 'v' + version;
    exec("git reset --hard " + version, function(error) {
      if(error) return cb(error);
      logger.log('info', '- Updated git repo');
      cb();
    });
  });
}

function removeCourse(cb) {
  var courseDir = path.join(helpers.getFrameworkDir(), FOLDERS.Source, FOLDERS.Course);
  fs.remove(courseDir, function(error) {
    if(error) return cb(error);
    logger.log('info', '- Removed demo course');
    cb();
  });
}

function npmInstall(cb) {
  exec("npm install", function(error) {
    if(error) return cb(error);
    logger.log('info', '- Installed node packages');
    cb();
  });
}

function adaptInstall(cb) {
  exec("adapt install", function(error) {
    if(error) return cb(error);
    logger.log('info', '- Installed adapt plugins');
    cb();
  });
}

function copyCustomPlugins(cb) {
  // TODO should probably un-nest this
  async.each(['component','extension','theme','menu'], function(type, eachCb) {
    database.getDatabase(function(error, db) {
      if(error) return eachCb(error);

      db.retrieve(type + 'type', { isLocalPackage: true }, function(error, plugins) {
        if(error) return eachCb(error);

        async.each(plugins, function(plugin, each2Cb) {
          var versionsDir = path.join('plugins', 'content', type, 'versions', plugin.name);

          fs.readdir(versionsDir, function(error, contents) {
            if(error) return each2Cb(error);

            var latest = contents.sort(helpers.compareVersions).pop();
            var srcDir = path.join(versionsDir, latest, plugin.name);

            var typeDir = type + (type === 'menu' || type === 'theme' ? '' : 's');
            var destDir = path.join(helpers.getFrameworkDir(), FOLDERS.Source, typeDir, plugin.name);

            fs.copy(srcDir, destDir, each2Cb);
          });
        }, eachCb);
      });
    });
  }, function(error) {
    if(error) return cb(error);
    logger.log('info', '- Copied custom plugin files to framework src');
    cb();
  });
}

function writeBuildFlags(cb) {
  origin.tenantmanager.retrieveTenants({}, function(error, tenants) {
    if(error) return cb(error);

    async.each(tenants, function(tenant, eachCb) {
      origin.contentmanager.getContentPlugin('course', function(error, plugin) {
        if(error) return eachCb(error);

        plugin.retrieve({ _tenantId: tenant._id }, function(error, courses) {
          if(error) return eachCb(error);

          async.each(courses, function(course, eachCb2) {
            origin.emit('rebuildCourse', tenant._id.toString(), course._id.toString());
            eachCb2();
          }, eachCb);
        });
      });
    }, cb);
  });
}

function updateVersionJson(version, cb) {
  logger.log('info', '- Updating version.json');

  var versionPath = path.join(origin.configuration.getConfig('serverRoot'), 'version.json');
  fs.readJson(versionPath, function(error, versionJson) {
    if(error) return cb(error);

    versionJson['adapt_framework'] = version;
    fs.writeJson(versionPath, versionJson, cb);
  });
}
