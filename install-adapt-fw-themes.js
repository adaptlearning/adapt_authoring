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
const util = require('util');
// Convert exec to a promise-based function
const execPromise = util.promisify(exec);


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
    fs.readJSON(path.join('./', "adapt-framework-themes.json"),async function(error, json) {
      if (error) {
        return "Failed";
      }
      if(data.dbConnectionUri){
        try {
          await mongoose.connect(data.dbConnectionUri,dbOptions);
          var Themetypes = mongoose.model('themetypes',new mongoose.Schema({}, { strict: false }));
          console.log('Connect MongoDB successfully!');
        } catch (err) {
          console.error('Connect MongoDB fail:', err.message);
        }
      }else{
      }
      var cmsThemes = Object.entries(json.themeDependencies).map(([key, value]) => ({ key, value }));

      await async.eachSeries(cmsThemes,
        async function (theme, themeCallback) {
          const themeName = theme.key;
          let themeTag = "main";
          let override = true;
          let params = theme.value.split(',');
          let themeRepo = params[0];
          if(params.length > 2){
            themeTag = params[1];
            override =  params[2];
          }else if(params.length > 1){
            themeTag = params[1];
          }else{
          }
          console.log("*** Install Theme: "+themeName + " ***");
          try{
            if(override){
              let folderPath = `${dir}/src/theme/${themeName}`;
              // Check if the folder exists
              if (fsFile.existsSync(folderPath)) {
                // Delete the folder recursively
                await fsFile.promises.rm(folderPath, { recursive: true, force: true });
                console.log(`Folder '${folderPath}' deleted successfully.`);
              } else {
                console.log(`Folder '${folderPath}' does not exist.`);
              }
            }
            await execPromise(`git clone --branch ${themeTag} ${themeRepo} --single-branch --origin ${REMOTE_NAME} ${dir}/src/theme/${themeName}`);
          }catch(e){
            console.log(e);
          }
          console.log("insert theme types: "+themeName);
          //reading data from file
          let fileJsonPath= `${dir}/src/theme/${themeName}/themetypes.json`;
          try {
            const data =  await fsFile.promises.readFile(fileJsonPath,"utf-8"); // Đọc tệp JSON
            const jsonData = JSON.parse(data); // Chuyển đổi chuỗi JSON thành đối tượng JavaScript
            const themetype = await Themetypes.findOne({ name: themeName });
            if (themetype) {
              console.log(themeName + " is exist in database already");
              if(override){
                const resultMany = await Themetypes.deleteMany({ name: themeName }); 
                console.log(themeName + " is deleted already");
                const newTheme = new Themetypes(jsonData);
                await newTheme.save();
              }
            } else {
              const newTheme = new Themetypes(jsonData);
              await newTheme.save();
            }
            console.log(`Insert theme types ${themeName} successfully`);
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
