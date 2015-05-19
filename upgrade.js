var prompt = require('prompt');
var fs = require('fs');
var request = require('request');
var async = require('async');
var exec = require('child_process').exec;

// GLOBALS
var installedBuilderVersion = '';
var latestBuilderTag = '';
var installedFrameworkVersion = '';
var latestFrameworkTag = '';
var shouldUpdateBuilder = false;
var shouldUpdateFramework = false;
var versionFile = JSON.parse(fs.readFileSync('version.json'), {encoding: 'utf8'});
var configFile = JSON.parse(fs.readFileSync('conf/config.json'), {encoding: 'utf8'});

var steps = [
  function(callback) {

    console.log('Checking versions');

    if (versionFile) {
      installedBuilderVersion = versionFile.adapt_authoring;
      installedFrameworkVersion = versionFile.adapt_framework;
    }

    console.log('Currently installed versions. Builder: ' + installedBuilderVersion + ', Framework: ' + installedFrameworkVersion);
    callback();

  },
  function(callback) {

    console.log('Checking available Builder upgrades.');
    // Check the latest version of the project
    request({
      headers: {
        'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
      },
      uri: 'https://api.github.com/repos/adaptlearning/adapt_authoring/tags',
      method: 'GET'
    }, function (error, response, body) {
      
      if (!error && response.statusCode == 200) {
        var tagInfo = JSON.parse(body);
        
        if (tagInfo) {
          latestBuilderTag = tagInfo[0].name;
        }

        callback();
      }
          
    });

  },
  function(callback) {

    console.log('Checking available Framework upgrades.');
    // Check the latest version of the framework
    request({
      headers: {
        'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
      },
      uri: 'https://api.github.com/repos/adaptlearning/adapt_framework/tags',
      method: 'GET'
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var tagInfo = JSON.parse(body);
        
        if (tagInfo) {
          // For now - we should only worry about v1 tags of the framework
          async.detectSeries(tagInfo, function(tag, callback) {
            if (tag.name.split('.')[0] == 'v1') {
              callback(tag);
            }
          }, function(latestVersion) {
            
            latestFrameworkTag = latestVersion.name;
            callback();

          });
        }

      }
    });

  }, 
  function(callback) {
    // Check what needs upgrading
    if (latestBuilderTag != installedBuilderVersion) {
      shouldUpdateBuilder = true;
      console.log('Update for Builder is available: ' + latestBuilderTag);
    }

    if (latestFrameworkTag != installedFrameworkVersion) {
      shouldUpdateFramework = true;
      console.log('Update for Framework is available: ' + latestFrameworkTag);
    }

    // If neither of the Builder or Framework need updating then quit the upgrading process
    if (!shouldUpdateFramework && !shouldUpdateBuilder) {
      console.log('No updates available at this time\n');
      process.exit(0);
    }

    callback();

  }, function(callback) {
    // Upgrade Builder if we need to
    if (shouldUpdateBuilder) {
      
      upgradeBuilder(latestBuilderTag, function(err) {
        if (err) {
          return callback(err);
        }

        versionFile.adapt_authoring = latestBuilderTag;
        callback();

      });

    } else {
      callback();
    }

  }, function(callback) {

    // Upgrade Framework if we need to
    if (shouldUpdateFramework) {
      
      upgradeFramework(latestFrameworkTag, function(err) {
        if (err) {
          return callback(err);
        }
        
        versionFile.adapt_framework = latestFrameworkTag;
        callback();

      });

    } else {
      callback();
    }

  }, function(callback) {

    // After upgrading let's update the version.json to the latest version
    fs.writeFile('version.json', JSON.stringify(versionFile, null, 4), function(err) {
        if(err) {
          callback(err);
        } else {
          console.log("Version file updated\n");
          callback();
        }
    }); 

  }, function(callback) {
    // Left empty for any upgrade scripts - just remember to call the callback when done.
    callback();
  }];


/*console.log('Latest ' + latestBuilderTag);
console.log(installedBuilderVersion + latestBuilderTag);
console.log(installedFrameworkVersion + latestFrameworkTag);*/

/*prompt.message = '> ';
prompt.delimiter = '';*/

prompt.start();

// Prompt the user to begin the install
console.log('This will update the Adapt builder to the latest version. Would you like to continue?');
prompt.get({ name: 'Y/n', type: 'string', default: 'Y' }, function (err, result) {
  if (!/(Y|y)[es]*$/.test(result['Y/n'])) {
    return exitUpgrade();
  }
  
  //return exitUpgrade(1, 'whateva');

  // run steps
  async.series(steps, function (err, results) {

    if (err) {
      console.log('ERROR: ', err);
      return exitUpgrade(1, 'Upgrade was unsuccessful. Please check the console output.');
    }
    
    exitUpgrade(0, 'Great work! Your builder is now updated.');

  });
});

// This upgrades the Builder
function upgradeBuilder(tagName, callback) {

  console.log('Upgrading the Builder...please hold on!');
  var child = exec('git fetch origin', {
    stdio: [0, 'pipe', 'pipe']
  });
  
  child.stdout.on('data', function(err) {
    console.log(err);
  });
  child.stderr.on('data', function(err) {
    console.log(err);
  });
  
  child.on('exit', function (error, stdout, stderr) {
    if (error) {
      return console.log('ERROR: ' + error);
    }
    
    console.log("Fetch from github was successful.");
    console.log("Pulling latest changes...");

    var secondChild = exec('git reset --hard ' + tagName, {
      stdio: [0, 'pipe', 'pipe']
    });
    
    secondChild.stdout.on('data', function(err) {
      console.log(err);
    });

    secondChild.stderr.on('data', function(err) {
      console.log(err);
    });
    
    secondChild.on('exit', function (error, stdout, stderr) {
      if (error) {
        return console.log('ERROR: ' + error);
      }
      
      console.log("Builder has been updated.\n");
      callback();

    });

  });
}

// This upgrades the Framework
function upgradeFramework(tagName, callback) {
  console.log('Upgrading the Framework...please hold on!');

  var child = exec('git fetch origin', {
    cwd: 'temp/' + configFile.masterTenantID + '/adapt_framework',
    stdio: [0, 'pipe', 'pipe']
  });
  
  child.stdout.on('data', function(err) {
    console.log(err);
  });

  child.stderr.on('data', function(err) {
    console.log(err);
  });
  
  child.on('exit', function (error, stdout, stderr) {
    if (error) {
      return console.log('ERROR: ' + error);
    }
    
    console.log("Fetch from github was successful.");
    console.log("Pulling latest changes...");

    var secondChild = exec('git reset --hard ' + tagName, {
      cwd: 'temp/' + configFile.masterTenantID + '/adapt_framework',
      stdio: [0, 'pipe', 'pipe']
    });
    
    secondChild.stdout.on('data', function(err) {
      console.log(err);
    });

    secondChild.stderr.on('data', function(err) {
      console.log(err);
    });
    
    secondChild.on('exit', function (error, stdout, stderr) {
      if (error) {
        return console.log('ERROR: ' + error);
      }
      
      console.log("Framework has been updated.\n");
      callback();

    });

  });
}

/**
 * Exits the install with some cleanup, should there be an error
 *
 * @param {int} code
 * @param {string} msg
 */

function exitUpgrade (code, msg) {
  code = code || 0;
  msg = msg || 'Bye!';
  console.log(msg);
  process.exit(code);
}