var logger = require('./logger'),
    path = require('path'),
    util = require('util'),
    exec = require('child_process').exec;

// errors
function FrameworkError (message) {
  this.name = 'FrameworkError';
  this.message = message || 'Error building framework';
}

util.inherits(FrameworkError, Error);


var FRAMEWORK_DIR = 'adapt_framework',
  GIT_FRAMEWORK_CLONE_URL = 'https://github.com/adaptlearning/adapt_framework.git';

function cloneFramework(app, next) {

  logger.log('info', 'Installing Adapt Framework');

  var command = exec('git clone ' + GIT_FRAMEWORK_CLONE_URL, {cwd: require('./configuration').serverRoot},
      function (error, stdout, stderr) {
        if (error) {
          app && app.sockets.emit('output', new FrameworkError(error.toString()));
          logger.log('error', 'exec error: ' + error);

          return next(error);
        }

        if (stderr.length != 0) {
          app && app.sockets.emit('output', new FrameworkError(stderr));
          logger.log('error', 'stderr: ' + stderr);
        }

        if (0 !== stdout.length) {
          logger.log('info', 'stdout: ' + stdout);
          app && app.sockets.emit('output', {type: 'info', value: stdout});
        }
        logger.log('info', 'Framework cloned!');
        return installFramework(app, next);
    });
};

function installFramework(app, next) {
  logger.log('info', 'in installFramework');

  var comand = exec('npm install --production', {cwd: path.join(require('./configuration').serverRoot, FRAMEWORK_DIR) },
    function(error, stdout, stderr) {
      if (error) {
        app && app.sockets.emit('output', error);
        logger.log('error', 'exec error: ', error);

        return next(error);
      }

      if (stderr.length != 0) {
        app && app.sockets.emit('output', new FrameworkError(stderr));
        logger.log('error', 'stderr: ' + stderr);
      }

      if (stdout.length != 0) {
        logger.log('info', 'stdout: ' + stdout);
        app && app.sockets.emit('output', {type: 'info', value: stdout});
      }
      return installFrameworkComponents(app, next);
  });
};

function installFrameworkComponents(app, next) {
  logger.log('info', 'in installFrameworkComponents');

  var command = exec('adapt install', {cwd: path.join(require('./configuration').serverRoot, FRAMEWORK_DIR) },
    function(error, stdout, stderr) {
      if (error) {
        app && app.sockets.emit('output', error);
        logger.log('error', 'exec error: ' + error);

        return next(error);
      }

      if (stderr.length != 0) {
        app && app.sockets.emit('output', new FrameworkError(stderr));
        logger.log('error', 'stderr: ' + stderr);
      }

      if (stdout.length != 0) {
        logger.log('info', 'stdout: ' + stdout);
        app && app.sockets.emit('output', {type: 'info', value: stdout});
        app && app.sockets.emit('installed:framework');
      }
      return next(null);
  });
};

exports.cloneFramework = cloneFramework;
exports.installFramework = installFramework;
exports.installFrameworkComponents = installFrameworkComponents;
