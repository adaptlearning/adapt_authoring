var fs = require('fs');
var path = require('path');
var should = require('should');

var configuration = require('../lib/configuration');
var database = require('../lib/database');
var pluginmanager = require('../lib/pluginmanager');

var testData = require('./testData.json').pluginmanager;
var pm;

before(function() {
  pm = pluginmanager.getManager();
});

after(function() {
  removePlugin();
});

it('should inherit from event emitter', function(done) {
  pm.on('foo', done);
  pm.emit('foo');
});

it('should detect when a new plugin needs to be installed', function(done) {
  addPlugin();
  pm.isUpgradeRequired(function(required) {
    required.should.be.true;
    done();
  });
});

it('should verify if a plugin is of a particular type and validate it', function () {
  // @TODO need to do fine grained validation, for now, just verify the type is correct
  addPlugin();
  pm.getPlugin(testData.type, testData.name, function(error, pluginInfo) {
    should.not.exist(error);
    var pluginTypes = pm.getPluginTypes();
    pluginTypes.should.containEql(pluginInfo.type);
  });
});

it('should be able to install new plugins', function(done) {
  addPlugin();
  pm.getPlugin(testData.type, testData.name, function(error, pluginInfo) {
    should.not.exist(error);
    pm.installPlugin(pluginInfo, function(error) {
      should.not.exist(error);
      // confirm that the plugin was installed
      pm.isInstalled(pluginInfo, function(installed) {
        installed.should.equal(true, 'Failed to verify that plugin was installed!');
        done();
      });
    });
  });
});

it('should provide a list of all installed plugins', function(done) {
  var plugin = { name: testData.name, type: testData.type };
  pm.getInstalledPlugins(function(error, pluginList) {
    should.not.exist(error);
    if (!pluginList[plugin.type] || !pluginList[plugin.type][plugin.name]) {
      throw new Error('failed to find expected plugin in installed plugins: ' + plugin.name);
    }
    done();
  });
});

it('should detect when an installed plugin has been removed from disk', function(done) {
  pm.getPlugin(testData.type, testData.name, function(error, pluginInfo) {
    should.not.exist(error);
    removePlugin();
    pm.testPluginState(pluginInfo, pluginmanager.states.MISSING_FROM_DISK, function(state) {
      state.should.equal(pluginmanager.states.MISSING_FROM_DISK);
      done();
    });
  });
});

it('should be able to uninstall plugins', function(done) {
  // first, make sure it's installed
  addPlugin();
  pm.getPlugin(testData.type, testData.name, function(error, pluginInfo) {
    should.not.exist(error);
    pm.uninstallPlugin(pluginInfo, function(error) {
      if(error) {
        done(error);
      } else {
        // confirm that the plugin was uninstalled
        pm.isInstalled(pluginInfo, function(installed) {
          if(installed) {
            done(new Error('Failed to verify that plugin was uninstalled!'));
          } else {
            done();
          }
        });
      }
    });
  });
});

function addPlugin() {
  // adds a temporary plugin on disk
  var pluginDir = path.join(configuration.serverRoot, pm.pluginDir, testData.type);
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir);
  }
  pluginDir = path.join(pluginDir, testData.name);
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir);
    var filePath = path.join(pluginDir, 'package.json');
    var fd = fs.openSync(filePath, 'w');
    fs.writeSync(fd, JSON.stringify(testData.data));
    fs.closeSync(fd);
  }
}

function removePlugin() {
  // remove the temporary plugin
  var pluginDir = path.join(configuration.serverRoot, pm.pluginDir, testData.type, testData.name);
  if(fs.existsSync(pluginDir)) {
    var filePath = path.join(pluginDir, 'package.json');
    fs.unlinkSync(filePath);
    fs.rmdirSync(pluginDir);
  }
}
