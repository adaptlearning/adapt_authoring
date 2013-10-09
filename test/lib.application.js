var builder = require('../'),
    configuration = require('../lib/configuration'),
    app = {};

before(function() {
  // ensures module initialisation occurs before other tests run
  configuration.load(configuration.serverRoot + '/test/testConfig.json');
  app = builder();
});

describe('application', function(){
  it ('should inherit from event emmiter', function(done){
    app.on('foo', done);
    app.emit('foo');
  });

});
