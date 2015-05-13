var prompt = require('prompt');
var fs = require('fs');
var request = require('request');
var async = require('async');

// GLOBALS
var installedBuilderVersion = '';
var latestBuilderTag = '';
var installedFrameworkVersion = '';
var latestFrameworkTag = '';

async.series([
  function(callback) {
    var versionFile = JSON.parse(fs.readFileSync('version.json'), {encoding: 'utf8'});

    if (versionFile) {
      installedBuilderVersion = versionFile.adapt_authoring;
      installedFrameworkVersion = versionFile.adapt_framework;
    }
console.log('readFileSync');
   // callback();
  },
  function(callback) {
    // Check the latest version of the project
    request({
      headers: {
        'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
      },
      uri: 'https://api.github.com/repos/adaptlearning/adapt_authoring/tags',
      method: 'GET'
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log('tag data' + body);
          var tagInfo = JSON.parse(body);

          if (tagInfo) {
            latestBuilderTag = tagInfo[0].name;
          }

      //    callback();
       }

          
    });
  },
  function(callback) {
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
            latestFrameworkTag = tagInfo[0].name;
          }

          callback();
       }
    });
  }, 
  function(callback) {
    if (latestBuilderTag == installedBuilderVersion && latestFrameworkTag == installedFrameworkVersion) {
      console.log('No updates available at this time');
      process.exit(0);
    }

    callback();
  }
], function(err, results) {

});


console.log('Latest ' + latestBuilderTag);
console.log(installedBuilderVersion + latestBuilderTag);
console.log(installedFrameworkVersion + latestFrameworkTag);

prompt.message = '> ';
prompt.delimiter = '';

prompt.start();

// Prompt the user to begin the install
console.log('This will update the Adapt builder to the latest version. Would you like to continue?');
prompt.get({ name: 'Y/n', type: 'string', default: 'Y' }, function (err, result) {
  if (!/(Y|y)[es]*$/.test(result['Y/n'])) {
    return exitInstall();
  }
  
  return exitInstall(1, 'whateva');

  // run steps
  async.series(steps, function (err, results) {
    if (err) {
      console.log('ERROR: ', err);
      return exitInstall(1, 'Install was unsuccessful. Please check the console output.');
    }
    
    exitInstall();
  });
});

/**
 * Exits the install with some cleanup, should there be an error
 *
 * @param {int} code
 * @param {string} msg
 */

function exitInstall (code, msg) {
  code = code || 0;
  msg = msg || 'Bye!';
  console.log(msg);
  
  // handle borked tenant, users, in case of a non-zero exit
  // if (0 !== code) {
  //   if (app && app.db) {
  //     if (masterTenant) {
  //       return app.db.destroy('tenant', { _id: masterTenant._id }, function (err) {
  //         if (superUser) {
  //           return app.db.destroy('user', { _id: superUser._id }, function (err) {
  //             return process.exit(code);
  //           });
  //         }
          
  //         return process.exit(code);
  //       }); 
  //     }
  //   }
  // }
  
  process.exit(code);
}