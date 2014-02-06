var fs = require('fs'),
    path = require('path'),
    builder = require('../'),
    configuration = require('../lib/configuration');

describe('configuration', function() {
  var tmpDir, tmpFile;

  before(function(){
    tmpDir = path.join(configuration.serverRoot, 'tmp');
    tmpFile = path.join(tmpDir, 'tempConfig.json');
    // create a temp config file
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    if (!fs.existsSync(tmpFile)) {
      var fd = fs.openSync(tmpFile, 'w');
      fs.writeSync(fd, JSON.stringify({
          serverPort: '4321'
      }));
    }
  });

  after(function(){
    // delete the temp config file 
    if (fs.existsSync(tmpFile)) {
       fs.unlinkSync(tmpFile);
    }

    if (fs.existsSync(tmpDir)) {
      fs.rmdirSync(tmpDir);
    }
  });

  it('should allow me to load a configuration from disk', function() {
    var oldFile = configuration.configFile;
    configuration.load(tmpFile,function libConfigTestLoad(){
      configuration.getConfig('serverPort').should.equal('4321');
    });
    configuration.load(oldFile);
  });

  it('should allow me to set/get a global configuration variable', function(){
    configuration.setConfig('foo', 10);
    configuration.getConfig('foo').should.equal(10);
  });

  it('should allow me to set/get a module configuration variable', function(){
    configuration.setModuleConfig('foo', 'bar', 10);
    configuration.getModuleConfig('foo', 'bar').should.equal(10);
  });

  it('should allow me to retrieve all config values for a module', function(){
    // add a few configs for module foo
    configuration.setModuleConfig('foo', 'bar', 10);
    configuration.setModuleConfig('foo', 'fizz', 'buzz');

    // retrieve the config object for foo and verify
    var moduleConfig = configuration.getModuleConfig('foo');
    moduleConfig.should.have.property('bar', 10);
    moduleConfig.should.have.property('fizz', 'buzz');
  });
});
