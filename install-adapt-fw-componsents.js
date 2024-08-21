var configuration = require('./lib/configuration');
var OutputConstants = require('./lib/outputmanager').Constants;
var exec = require("child_process").exec;
var path = require("path");
var fs = require('fs-extra');
const fsFile = require('fs');
var async = require("async");
var _ = require("underscore");
var mongoose = require("mongoose");
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

const componenttypesSchema = new mongoose.Schema({
  name: String,
});

const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
};

(function () {
  var configFile = 'conf/config.json';
  fs.readJSON(configFile,function(err, data){
    if (err) throw err;
    var dir = path.join(configuration.tempDir, data.masterTenantID, OutputConstants.Folders.Framework);
    console.log(data);
    fs.readJSON(path.join('./', "adapt-framework-components.json"),async function(error, json) {
      if (error) {
        return "Failed";
      }
      if(data.dbConnectionUri){
        console.log(data.dbConnectionUri);
        try {
          await mongoose.connect(data.dbConnectionUri,dbOptions);
          console.log('Connect MongoDB successfully!');
        } catch (err) {
          console.error('Connect MongoDB fail:', err.message);
        }finally{
  
        }
  
      }else{
  
      }
      var cmsPlugins = Object.entries(json.cmsDependencies).map(([key, value]) => ({ key, value }));

      await async.eachSeries(cmsPlugins,
        async function (plugin, pluginCallback) {
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
          console.log("insert component types: "+pluginName);
          //reading data from file
          let fileJsonPath= `${dir}/src/components/${pluginName}/componenttypes.json`;
          try {
            const data =  await fsFile.promises.readFile(fileJsonPath,"utf-8"); // Đọc tệp JSON
            const jsonData = JSON.parse(data); // Chuyển đổi chuỗi JSON thành đối tượng JavaScript
            const Componenttypes = mongoose.model('componenttypes',new mongoose.Schema({}, { strict: false }));
            const componenttype = await Componenttypes.findOne({ name:pluginName });
            if (componenttype) {
              console.log(pluginName + " is exist in database already");
            } else {
              const newComponent = new Componenttypes(jsonData);
              await newComponent.save();
              console.log(`Insert component types ${pluginName} successfully`);
            }
          } catch (err) {
            console.log('Read fail from file');
            throw err; 
          }
        }
      )
      mongoose.disconnect();
    })
  });
})()
