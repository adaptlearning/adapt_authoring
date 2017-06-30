var builder = require('./lib/application');
var prompt = require('prompt');
var fs = require('fs');
var request = require('request');
var async = require('async');
var exec = require('child_process').exec;
var rimraf = require('rimraf');
var path = require('path');
var optimist = require('optimist');

// Constants
var DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36';

// Helper
var isVagrant = function () {
  if (process.argv.length > 2) {
    return true;
  }
  return false;
};

// GLOBALS
var app = builder();
var installedBuilderVersion = '';
var latestBuilderTag = null;
var installedFrameworkVersion = '';
var latestFrameworkTag = null;
var shouldUpdateBuilder = false;
var shouldUpdateFramework = false;
var configFile = JSON.parse(fs.readFileSync(path.join('conf','config.json')), {encoding: 'utf8'});
var upgradeOptions = {
  automatic: true
};

try{
  var versionFile = JSON.parse(fs.readFileSync('version.json'), {encoding: 'utf8'});
}
catch (err) {
  versionFile = {}
}

var steps = [
  function(callback) {

    console.log('Checking versions');

    if (typeof versionFile.adapt_authoring !== 'undefined') {
      installedBuilderVersion = versionFile.adapt_authoring;
    }

    if (typeof versionFile.adapt_framework !== 'undefined') {
      installedFrameworkVersion = versionFile.adapt_framework;
    }

    if(typeof configFile.authoringToolRepository === 'undefined'){
      configFile.authoringToolRepository = 'https://github.com/adaptlearning/adapt_authoring.git';
    }

    if(typeof configFile.frameworkRepository === 'undefined'){
      configFile.frameworkRepository = 'https://github.com/adaptlearning/adapt_framework.git';
    }

    console.log('Currently installed versions:\n- ' + app.polyglot.t('app.productname') + ': ' + installedBuilderVersion + '\n- Adapt Framework: ' + installedFrameworkVersion);
    callback();

  },
  function(callback) {
    if (upgradeOptions.automatic) {
      async.series([function(callback) {

          if (configFile.frameworkRepository !== 'https://github.com/adaptlearning/adapt_framework.git') {
            exitUpgrade(1, 'You are using a custom framework repository, you must use manual upgrade and specify a git tag or branch.')
          };

          console.log('Checking for ' + app.polyglot.t('app.productname') + ' upgrades...');
          // Check the latest version of the project
          request({
            headers: {
              'User-Agent': DEFAULT_USER_AGENT
            },
            uri: 'https://api.github.com/repos/adaptlearning/adapt_authoring/tags',
            method: 'GET'
          }, function(error, response, body) {

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
            console.log('Checking for Adapt Framework upgrades...');
            // Check the latest version of the framework
            request({
              headers: {
                'User-Agent': DEFAULT_USER_AGENT
              },
              uri: 'https://api.github.com/repos/adaptlearning/adapt_framework/tags',
              method: 'GET'
            }, function(error, response, body) {
              if (!error && response.statusCode == 200) {
                var tagInfo = JSON.parse(body);

                if (tagInfo) {
                  latestFrameworkTag = tagInfo[0].name;
                }

                callback();
              }
            });

          },
          function(callback) {
            // Check what needs upgrading
            if (latestBuilderTag != installedBuilderVersion) {
              shouldUpdateBuilder = true;
              console.log('Update for ' + app.polyglot.t('app.productname') + ' is available: ' + latestBuilderTag);
            }

            if (latestFrameworkTag != installedFrameworkVersion) {
              shouldUpdateFramework = true;
              console.log('Update for Adapt Framework is available: ' + latestFrameworkTag);
            }

            // If neither of the Builder or Framework need updating then quit the upgrading process
            if (!shouldUpdateFramework && !shouldUpdateBuilder) {
              console.log('No updates available at this time\n');
              process.exit(0);
            }

            callback();

          }],
        function(err, results) {
          if (err){
            console.error('ERROR:', err);
            return callback(err)
          }
          return callback();
        })
    } else {
      shouldUpdateBuilder = true;
      shouldUpdateFramework = true;
      latestBuilderTag = upgradeOptions.authoringToolGitTag;
      latestFrameworkTag = upgradeOptions.frameworkGitTag;
      return callback();
    }

  },
  function(callback) {
    // Upgrade Builder if we need to
    if (shouldUpdateBuilder) {

      upgradeBuilder(latestBuilderTag, function(err, data) {
        if (err) {
          console.error('ERROR:', err);
          return callback(err);
        }

        versionFile.adapt_authoring = 'v' + data.version;
        callback();

      });

    } else {
      callback();
    }

  }, function(callback) {

    // Upgrade Framework if we need to
    if (shouldUpdateFramework) {

      upgradeFramework(latestFrameworkTag, function(err, data) {
        if (err) {
          console.error('ERROR:', err);
          return callback(err);
        }

        versionFile.adapt_framework = 'v' + data.version;
        callback();

      });

    } else {
      callback();
    }

  }, function(callback) {

    // After upgrading let's update the version.json to the latest version
    fs.writeFile('version.json', JSON.stringify(versionFile, null, 4), function(err) {
      if(err) {
        console.error('ERROR:', err);
        callback(err);
      } else {
        console.log("Version file updated\n");
        callback();
      }
    });

  }, function(callback) {
    if (shouldUpdateFramework) {
      // If the framework has been updated, interrogate the adapt.json file from the adapt_framework
      // folder and install the latest versions of the core plugins
      fs.readFile(path.join(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework', 'adapt.json'), function (err, data) {
        if (err) {
          return callback(err);
        }

        var json = JSON.parse(data);
        // 'dependencies' contains a key-value pair representing the plugin name and the semver
        var plugins = Object.keys(json.dependencies);

        async.eachSeries(plugins, function(plugin, pluginCallback) {

          if(json.dependencies[plugin] === '*') {
            app.bowermanager.installLatestCompatibleVersion(plugin, pluginCallback);
          } else {
            app.bowermanager.installPlugin(plugin, json.dependencies[plugin], pluginCallback);
          }

        }, function(err) {
          if (err) {
            console.error('ERROR:', err);
            return callback(err)
          }

          callback();
        });
      });
    } else {
      callback();
    }
  }
];

app.run({skipVersionCheck: true, skipStartLog: true});

app.on('serverStarted', function () {
  prompt.override = optimist.argv;
  prompt.start();

  // Prompt the user to begin the install
  if (isVagrant()) {
    console.log(`\nUpdate the ${app.polyglot.t('app.productname')} (and/or Adapt Framework) to the latest released version.`);
  } else {
    console.log(`\nThis script will update the ${app.polyglot.t('app.productname')} (and/or Adapt Framework) to the latest released version. Would you like to continue?`);
  }

  prompt.get({ name: 'Y/n', type: 'string', default: 'Y' }, function (err, result) {
    if (!/(Y|y)[es]*$/.test(result['Y/n'])) {
      return exitUpgrade();
    }

    prompt.get({properties: {updateAutomatically: {description: 'Update automatically', type: 'string', default: 'Y'}}}, function (err, result) {
      if (result['updateAutomatically'] === 'Y' || result['updateAutomatically'] === 'y') {
        // run steps
        async.series(steps, function (err, results) {

          if (err) {
            console.error('ERROR: ', err);
            return exitUpgrade(1, 'Upgrade was unsuccessful. Please check the console output.');
          }

          console.log(' ');

          exitUpgrade(0, 'Great work! Your ' + app.polyglot.t('app.productname') + ' is now updated.');
        });
      } else {
        upgradeOptions.automatic = false;
        var promptSchema = {
          properties: {
            authoringToolGitTag: {
              type: 'string',
              required: true,
              description: 'Authoring Tool git revision (enter branch name or tag as tags/[tagname])'
            },
            frameworkGitTag: {
              type: 'string',
              required: true,
              description: 'Framework git revision (enter branch name or tag as tags/[tagname])'
            }
          }
        };

        prompt.get(promptSchema, function (err, result) {
          upgradeOptions['authoringToolGitTag'] = result.authoringToolGitTag;
          upgradeOptions['frameworkGitTag'] = result.frameworkGitTag;

          async.series(steps, function(err, results) {

            if (err) {
              console.error('ERROR: ', err);
              return exitUpgrade(1, 'Upgrade was unsuccessful. Please check the console output.');
            }

            console.log(' ');

            exitUpgrade(0, 'Great work! Your ' + app.polyglot.t('app.productname') + ' is now updated.');
          });
        });
      }
    })
  });
});

// This upgrades the Builder
function upgradeBuilder(tagName, callback) {

  console.log('Upgrading the ' + app.polyglot.t('app.productname') + '...please hold on!');
  var child = exec('git remote set-url origin ' + configFile.authoringToolRepository + ' && git fetch origin', {
    stdio: [0, 'pipe', 'pipe']
  });

  child.stdout.on('data', function(err) {
    console.log(err);
  });
  child.stderr.on('data', function(err) {
    console.error('ERROR: ', err);
  });

  child.on('exit', function (error, stdout, stderr) {
    if (error) {
      console.error('ERROR: ' + error);
      return callback(error);
    }

    console.log("Fetch from git was successful.");
    console.log("Pulling latest changes...");

    if(!tagName.includes('tags')){
      tagName = 'origin/' + tagName
    }

    var secondChild = exec('git reset --hard ' + tagName, {
      stdio: [0, 'pipe', 'pipe']
    });

    secondChild.stdout.on('data', function(err) {
      console.log(err);
    });

    secondChild.stderr.on('data', function(err) {
      console.error('ERROR: ', err);
    });

    secondChild.on('exit', function (error, stdout, stderr) {
      if (error) {
        console.error('ERROR: ' + error);
        return callback(err);
      }

      console.log("Installing " + app.polyglot.t('app.productname') + " dependencies.\n");

      var thirdChild = exec('npm install', {
        stdio: [0, 'pipe', 'pipe']
      });

      thirdChild.stdout.on('data', function(err) {
        console.log(err);
      });

      thirdChild.stderr.on('data', function(err) {
        console.error('ERROR: ' + err);
      });

      thirdChild.on('exit', function (error, stdout, stderr) {
        if (error) {
          console.error('ERROR: ' + error);
          return callback(error)
        }
        console.log("Dependencies installed.\n");

        console.log("Building front-end.\n");

        var fourthChild = exec('grunt build:prod', {
          stdio: [0, 'pipe', 'pipe']
        });

        fourthChild.stdout.on('data', function(err) {
          console.log(err);
        });

        fourthChild.stderr.on('data', function(err) {
          console.error('ERROR: ' + err);
        });

        fourthChild.on('exit', function (error, stdout, stderr) {
          if (error) {
            console.error('ERROR: ' + error);
            return callback(err)
          }

          console.log("front-end built.\n");

          console.log(app.polyglot.t('app.productname') + " has been updated.\n");
          fs.readFile('package.json', function(error, data) {
            if (error) {
              console.error('ERROR: ' + error);
              return callback(err)
            }

            var packageFile = JSON.parse(data);

            return callback(null, {version: 'v' + packageFile.version});
          });
        });
      });
    });
  });
}

// This upgrades the Framework
function upgradeFramework(tagName, callback) {
  console.log('Upgrading the Adapt Framework...please hold on!');
  var cwd = path.resolve('temp', configFile.masterTenantID, 'adapt_framework');
  var child = exec('git remote set-url origin ' + configFile.frameworkRepository + ' && git fetch origin', {
    cwd: cwd,
    stdio: [0, 'pipe', 'pipe']
  });

  child.stdout.on('data', function(err) {
    console.log(err);
  });

  child.stderr.on('data', function(err) {
    console.error(err);
  });

  child.on('exit', function (error, stdout, stderr) {
    if (error) {
      console.error('ERROR: ' + error);
      return callback(error);
    }

    console.log("Fetch from Git was successful.");
    console.log("Pulling latest changes...");

    if(!tagName.includes('tags')){
      tagName = 'origin/' + tagName
    }

    var secondChild = exec('git reset --hard ' + tagName + ' && npm install', {
      cwd: cwd,
      stdio: [0, 'pipe', 'pipe']
    });

    secondChild.stdout.on('data', function(err) {
      console.log(err);
    });

    secondChild.stderr.on('data', function(err) {
      console.error(err);
    });

    secondChild.on('exit', function (error, stdout, stderr) {
      if (error) {
        console.error('ERROR: ' + error);
        return callback(error);
      }

      console.log("Framework has been updated.\n");

      rimraf(path.resolve(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework', 'src', 'course'), function(err) {
        if (err) {
          console.log(err);
        }

        fs.readFile(path.resolve(configFile.root, 'temp', configFile.masterTenantID, 'adapt_framework', 'package.json'), function(error, data) {
          if (error) {
            console.error('ERROR: ' + error);
            return callback(error);
          }

          var packageFile = JSON.parse(data);

          return callback(null, {version: 'v' + packageFile.version});
        });
      });

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
