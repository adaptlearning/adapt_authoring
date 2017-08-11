var request = require('supertest');
var should = require('should');

var origin = require('../');

it('should be listening to HTTP requests on the specified host/port', function(done) {
  var agent = request.agent(origin().getServerURL())
    .get('/')
    .set('Accept', 'text/html')
    .expect(200)
    .expect('Content-Type', /html/)
    .end(done);
});

it('should inherit from event emitter', function(done) {
  var app = origin();
  app.on('foo', done);
  app.emit('foo');
});
