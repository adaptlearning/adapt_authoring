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
    fs.readJSON(path.join('./', "adapt-plugin.json"), function(error, json) {
      if (error) {
        return "Failed";
      }
      var cmsPlugins = Object.entries(json.cmsDependencies).map(([key, value]) => ({ key, value }));

      async.eachSeries(cmsPlugins,
        function (plugin, pluginCallback) {
          const pluginName = plugin.key;
          const pluginRepo = plugin.value.split(',')[1];
          const pluginTag = plugin.value.split(',')[0];
          execCommand(
            `git clone --branch ${pluginTag} ${pluginRepo} --single-branch --origin ${REMOTE_NAME} ${dir}/src/components/${pluginName}`,
            function (error) {
              if (error) {           
                console.log(`Failed to install ${pluginName}, ${error}`);
                return;
              }
              console.log(`Cloned ${pluginRepo} successfully.`);
              pluginCallback();
            },
          );
        }
      )
    })
  });
})()
