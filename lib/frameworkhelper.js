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

          return next(new FramworkError(stderr));
        }

        if (stdout.length != 0) {
          logger.log('info', 'stdout: ' + stdout);
          app && app.sockets.emit('output', {type: 'info', value: stdout});
          logger.log('info', 'Framwork cloned!');
          return installFramework(app, next);
        } else {
          return next(new FrameworkError('Unexpected error in cloneFramework'));
        }
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
        logger.log('info', 'stdout: ******************* installFramework');
        logger.log('info', 'stdout: ' + stdout);
        app && app.sockets.emit('output', {type: 'info', value: stdout});

        logger.log('info', 'stdout: ******************* emit completed');

        return installFrameworkComponents(app, next);
      } else {
        logger.log('error', 'stdout: ******************* error');
        return next(new FrameworkError('Unexpected error in installFramework'));
      }
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

        return next(new FrameworkError(stderr));
      }

      if (stdout.length != 0) {
        logger.log('info', 'stdout: ' + stdout);
        app && app.sockets.emit('output', {type: 'info', value: stdout});
        app && app.sockets.emit('installed:framework');

        return next(null);
      } else {
       return next(new FrameworkError('Unexpected error in installFrameworkComponents'));
      }
  });
};

exports.cloneFramework = cloneFramework;
exports.installFramework = installFramework;
exports.installFrameworkComponents = installFrameworkComponents;
