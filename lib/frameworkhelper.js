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


var FRAMEWORK_DIR = 'adapt_framework',
  DEFAULT_BRANCH = 'master',
  GIT_FRAMEWORK_CLONE_URL = 'https://github.com/adaptlearning/adapt_framework.git';
  
function flog(msg) {
  console.log(' ' + msg);
}

function cloneFramework (next) {
  fs.exists (path.join(serverRoot, FRAMEWORK_DIR), function (exists) {
    if (exists) {
      // don't bother installing again
      console.log('The Adapt Framework directory was found, skipping installation.');
      return next(null);
    }

    console.log('The Adapt Framework was not found. It will now be installed...');
    var child = exec('git clone ' + GIT_FRAMEWORK_CLONE_URL, {
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
      return installFramework(next);
    });
  });
};

function installFramework (next) {
  var frameworkVersion = DEFAULT_BRANCH;

  try {
    var versionFile = JSON.parse(fs.readFileSync('version.json'), {encoding: 'utf8'});
    frameworkVersion = versionFile.adapt_framework;
  } catch (e) {
    console.log('Warning: Failed to determine compatible Adapt Framework version from version.json, so using ' + DEFAULT_BRANCH);
  }
  
  console.log('Running \'npm install\' for the Adapt Framework...');
  
  var child = exec('git checkout --quiet ' + frameworkVersion + ' && npm install', {
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
