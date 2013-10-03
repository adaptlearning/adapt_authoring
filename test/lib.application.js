var builder = require('../');

describe('application', function(){
  it ('should inherit from event emmiter', function(done){
    var app = builder();
    app.on('foo', done);
    app.emit('foo');
  });
});
