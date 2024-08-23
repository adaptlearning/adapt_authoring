var configuration = require('./lib/configuration');
var OutputConstants = require('./lib/outputmanager').Constants;
var exec = require("child_process").exec;
var path = require("path");
var fs = require('fs-extra');
var async = require("async");
var _ = require("underscore");

var REMOTE_NAME = "origin";

function execCommand(cmd, opts, callback) {
  if (arguments.length === 2) {
    callback = opts;
    opts = {};
  }
  var stdoutData = "";
  var errData = "";
  var child = exec(cmd, _.extend({ stdio: [0, "pipe", "pipe"] }, opts));
  child.stdout.on("data", function (data) {
    stdoutData += data;
  });
  child.stderr.on("data", function (data) {
    errData += data;
  });
  child.on("exit", function (error) {
    if (error) {
      return callback(errData || error);
    }
    callback(null, stdoutData);
  });
}


(function () {
  var configFile = 'conf/config.json';
  fs.readJSON(configFile, function(err, data) {
    if (err) throw err;
    var dir = path.join(configuration.tempDir, data.masterTenantID, OutputConstants.Folders.Framework);
    fs.readJSON(path.join('./', "adapt-themes.json"), function(error, json) {
      if (error) {
        return "Failed";
      }
      var cmsThemes = Object.entries(json.themeDependencies).map(([key, value]) => ({ key, value }));

      async.eachSeries(cmsThemes,
        function (theme, themeCallback) {
          const themeName = theme.key;
          const themeRepo = theme.value.split(',')[1];
          const themeTag = theme.value.split(',')[0];
          execCommand(
            `git clone --branch ${themeTag} ${themeRepo} --single-branch --origin ${REMOTE_NAME} ${dir}/src/theme/${themeName}`,
            function (error) {
              if (error) {           
                console.log(`Failed to install ${themeName}, ${error}`);
                return;
              }
              console.log(`Cloned ${themeRepo} successfully.`);
              themeCallback();
            },
          );
        }
      )
    })
  });
})()
