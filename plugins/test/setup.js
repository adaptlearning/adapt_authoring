var path = require('path'),
    fs = require('fs'),
    builder = require('../../');
    rimraf = require('rimraf');

var testDataRoot = false;

before(function(done) {
  // bootstrapping!
  var app = builder();
  app.use({ configFile: path.join('test', 'testConfig.json')});
  app.run();
  app.once('serverStarted', function (server) {
    testDataRoot = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'));

    if(fs.existsSync(testDataRoot)){
      rimraf.sync(testDataRoot);
    }

    fs.mkdirSync(testDataRoot);
    fs.existsSync(testDataRoot).should.be.ok;
    done();
  });
});

after(function () {
  if (fs.existsSync(testDataRoot)) { // any tests that add to this directory should clean up after themselves!
    rimraf(testDataRoot,function(){
      fs.existsSync(testDataRoot).should.not.be.ok;
    });
  }
});

