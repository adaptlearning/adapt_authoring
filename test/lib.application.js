var path = require('path'),
    builder = require('../');

before(function() {
  // bootstrapping!
  var app = builder();
  app.use({ configFile: path.join('test', 'testConfig.json')});
  app.start();
});

describe('application', function(){
  it ('should inherit from event emmiter', function(done) {
    var app = builder();
    app.on('foo', done);
    app.emit('foo');
  });
});
