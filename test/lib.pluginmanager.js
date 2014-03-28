var origin = require('../'),
    fs = require('fs'),
    path = require('path'),
    configuration = require('../lib/configuration'),
    database = require('../lib/database'),
    should = require('should'),
    pluginmanager = require('../lib/pluginmanager');

/**
 * It is conceivable that someone might write an output/fooPlugin plugin, but
 * I'd say we can address that if it happens ...
 */

describe('pluginmanager', function(){
  var helper = {
    pluginManager: {},
    fooPlugin: {
      "displayName": "Foo Plugin",
      "version": "1.0.0",
      "requires": "0.0.1"
    },
    init: function () {
      this.pluginManager = pluginmanager.getManager();
    },
    addPlugin: function () {
      // adds a temporary plugin on disk
      var pluginDir = path.join(configuration.serverRoot, this.pluginManager.pluginDir, 'output');
      if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir);
      }

      pluginDir = path.join(pluginDir, 'fooPlugin');
      if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir);
        var filePath = path.join(pluginDir, 'package.json');
        var fd = fs.openSync(filePath, 'w');
        fs.writeSync(fd, JSON.stringify(this.fooPlugin));
        fs.closeSync(fd);
      }
    },
    removePlugin: function () {
      // remove the temporary plugin
      var pluginDir = path.join(configuration.serverRoot, this.pluginManager.pluginDir, 'output', 'fooPlugin');
      if (fs.existsSync(pluginDir)) {
        var filePath = path.join(pluginDir, 'package.json');
        fs.unlinkSync(filePath);
        fs.rmdirSync(pluginDir);
      }
    }
  };

  before(function(){
    helper.init();
  });

  after(function(){
    helper.removePlugin();
  });

  it ('should inherit from event emmiter', function(done){
    helper.pluginManager.on('foo', done);
    helper.pluginManager.emit('foo');
  });

  it ('should detect when a new plugin needs to be installed', function (done) {
    helper.addPlugin();
    helper.pluginManager.isUpgradeRequired(function (required) {
      required.should.be.true;
      done();
    });
  });

  it ('should verify if a plugin is of a particular type and validate it', function (){
    // @TODO need to do fine grained validation, for now, just verify the type is correct
    helper.addPlugin();
    helper.pluginManager.getPlugin('output', 'fooPlugin', function (error, pluginInfo) {
      should.not.exist(error);
      var pluginTypes = helper.pluginManager.getPluginTypes();
      pluginTypes.should.include(pluginInfo.type);
    });
  });

  it ('should allow installation of a new plugin', function (done){
    helper.addPlugin();
    helper.pluginManager.getPlugin('output', 'fooPlugin', function (error, pluginInfo) {
      should.not.exist(error);
      helper.pluginManager.installPlugin(pluginInfo, function (error) {
        if (error) {
          done(error);
        } else {
          // confirm that the plugin was installed
          helper.pluginManager.isInstalled(pluginInfo, function (installed) {
            if (installed) {
              done();
            } else {
              done(new Error('Failed to verify that plugin was installed!'));
            }
          });
        }
      });
    });
  });

  it ('should provide a list of all installed plugins', function (done) {
    // these plugins should be installed
    var shouldBeInstalled = [
      { name: "fooPlugin", type: "output" }
    ];
    helper.pluginManager.getInstalledPlugins(function (error, pluginList) {
      should.not.exist(error);
      if (error) {
        done(error);
      } else {
        for (var i = 0; i < shouldBeInstalled.length; ++i) {
          var plugin = shouldBeInstalled[i];
          if (!pluginList[plugin.type] || !pluginList[plugin.type][plugin.name]) {
            done(new Error('failed to find expected plugin in installed plugins: ' + plugin.name));
            return;
          }
        }
        done();
      }
    });
  });

  //it ('should allow a plugin to be disabled', function (){
  //});

  it ('should detect when an installed plugin has been removed from disk', function (done) {
    helper.pluginManager.getPlugin('output', 'fooPlugin', function (error, pluginInfo) {
      should.not.exist(error);
      helper.removePlugin();
      helper.pluginManager.testPluginState(pluginInfo, pluginmanager.states.MISSING_FROM_DISK, function (state) {
        // should be missing
        state.should.equal(pluginmanager.states.MISSING_FROM_DISK);
        done();
      });
    });
  });

  it ('should allow a plugin to be uninstalled', function (done) {
    // first, make sure it's installed
    helper.addPlugin();
    helper.pluginManager.getPlugin('output', 'fooPlugin', function (error, pluginInfo) {
      should.not.exist(error);
      helper.pluginManager.uninstallPlugin(pluginInfo, function (error) {
        if (error) {
          done(error);
        } else {
          // confirm that the plugin was uninstalled
          helper.pluginManager.isInstalled(pluginInfo, function (installed) {
            if (installed) {
              done(new Error('Failed to verify that plugin was uninstalled!'));
            } else {
              done();
            }
          });
        }
      });
    });
  });

});
