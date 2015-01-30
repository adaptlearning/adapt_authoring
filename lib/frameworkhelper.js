var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    colors = require('colors'),
    exec = require('child_process').exec;

// errors
function FrameworkError (message) {
  this.name = 'FrameworkError';
  this.message = message || 'Error building framework';
}

util.inherits(FrameworkError, Error);


var FRAMEWORK_DIR = 'adapt_framework',
  GIT_FRAMEWORK_CLONE_URL = 'https://github.com/adaptlearning/adapt_framework.git';
  
function flog(msg) {
  console.log((' ' + msg).grey);
}

function cloneFramework (next) {
  var frameworkPath = FRAMEWORK_DIR;
  fs.exists (frameworkPath, function (exists) {
    if (exists) {
      // don't bother installing again
      console.log('The Adapt framework directory was found, skipping installation.');
      return next(null);
    }

    console.log('The Adapt framework was not found. It will be installed.');
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
      
      console.log("Clone from github was successful.\n");
      return installFramework(next);
    });
  });
};

function installFramework (next) {
  var frameworkPath = FRAMEWORK_DIR;
  
  console.log('Running npm install for the Adapt framework.');
  var child = exec('npm install', { 
    cwd: frameworkPath, 
    stdio: [0, 'pipe', 'pipe']
  });
    
  child.stdout.on('data', flog);
  child.stderr.on('data', flog);

  child.on('exit', function (error, stdout, stderr) {
    if (error) {
      console.log('ERROR: ', error);
      return next(error);
    }
    
    console.log("Completed the npm install.\n");
    return installFrameworkPlugins(next);
  });
};

function installFrameworkPlugins(next) {
  var frameworkPath = path.join(require('./configuration').serverRoot, FRAMEWORK_DIR);
  
  console.log('Installing plugins for the Adapt framework.');
  var child = exec('adapt install', { 
    cwd: frameworkPath, 
    stdio: [0, 'pipe', 'pipe']
  });

  child.stdout.on('data', flog);
  child.stderr.on('data', flog);
  
  child.on('exit', function(error, stdout, stderr) {
    if (error) {
      console.log('ERROR: ' + error);
      return next(error);
    }
    
    console.log("Successfully installed Adapt framework plugins.");
    return next(null);
  });
};

exports.cloneFramework = cloneFramework;
exports.installFramework = installFramework;
exports.installFrameworkPlugins = installFrameworkPlugins;
