var path = require('path'),
    fs = require('fs'),
    builder = require('../../');

before(function() {
  // bootstrapping!
  var app = builder();
  app.use({ configFile: path.join('test', 'testConfig.json')});
  app.start();

  var testDataRoot = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'));
  fs.mkdirSync(testDataRoot);
  fs.existsSync(testDataRoot).should.be.ok;
});

after(function () {
  // cleanup
  var app = builder();
  var testDataRoot = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'));
  if (fs.existsSync(testDataRoot)) { // any tests that add to this directory should clean up after themselves!
    fs.rmdirSync(testDataRoot);
    fs.existsSync(testDataRoot).should.not.be.ok;
  }
});

