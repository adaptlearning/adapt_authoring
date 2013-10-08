var builder = require('../');
console.log('required builder');
describe('application', function(){
  it ('should inherit from event emmiter', function(done){
    var app = builder();
    app.on('foo', done);
    app.emit('foo');
  });

});
