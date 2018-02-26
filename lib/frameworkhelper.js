// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var path = require('path'),
  fs = require('fs'),
  util = require('util'),
  rimraf = require('rimraf'),
  exec = require('child_process').exec,
  serverRoot = require('./configuration').serverRoot;

// errors
function FrameworkError (message) {
  this.name = 'FrameworkError';
  this.message = message || 'Error building framework';
}

util.inherits(FrameworkError, Error);


var FRAMEWORK_DIR = 'adapt_framework';

function flog(msg) {
  console.log(' ' + msg);
}

function cloneFramework (next, frameworkRepository, frameworkRevision) {
  fs.exists (path.join(serverRoot, FRAMEWORK_DIR), function (exists) {
    if (exists) {
      // don't bother installing again
      console.log('The Adapt Framework directory was found, skipping installation.');
      return next(null);
    }

    console.log('The Adapt Framework was not found. It will now be installed...');
    var child = exec('git clone ' + frameworkRepository, {
      stdio: [0, 'pipe', 'pipe']
    });

    child.stdout.on('data', flog);
    child.stderr.on('data', flog);

    child.on('exit', function (error, stdout, stderr) {
      if (error) {
        console.log('ERROR: ' + error);
        return next(error);
      }

      console.log("Clone from GitHub was successful.");
      return installFramework(next, frameworkRevision);
    });
  });
};

function installFramework (next, frameworkRevision) {

  console.log('Running \'npm install\' for the Adapt Framework...');

  var child = exec('git checkout --quiet ' + frameworkRevision + ' && npm install --loglevel error', {
    cwd: FRAMEWORK_DIR,
    stdio: [0, 'pipe', 'pipe']
  });

  child.stdout.on('data', flog);
  child.stderr.on('data', flog);

  child.on('exit', function (error, stdout, stderr) {
    if (error) {
      console.log('ERROR: ', error);
      return next(error);
    }

    console.log("Completed installing NodeJS modules.\n");

    // Remove the default course.
    rimraf(path.join(serverRoot, FRAMEWORK_DIR, 'src', 'course'), function(err) {
      if (err) {
        console.log('ERROR:', error);
      }

      return next();
    });
  });
};

exports.cloneFramework = cloneFramework;
exports.installFramework = installFramework;
