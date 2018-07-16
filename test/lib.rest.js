var request = require('supertest');
var should = require('should');

var origin = require('../');
var logger = require('../lib/logger');
var permissions = require('../lib/permissions');
var rest = require('../lib/rest');

var agent = {};

before(function(done) {
  permissions.ignoreRoute(/^\/api\/.*/);
  agent = request.agent(origin().getServerURL());
  done();
});

it('should be able to add POST handlers', function(done) {
  // add a dummy post service
  rest.post('/foo/:bar', function(req, res, next) {
    res.statusCode = 200;
    return res.json({ bar: parseInt(req.params.bar,10) });
  });
  // fire request
  agent.post('/api/foo/1')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.bar.should.equal(1);
      done();
    });
});

it('should be able to add GET handlers', function(done) {
  // add a dummy get service
  rest.get('/foo/:bar', function(req, res, next) {
    res.statusCode = 200;
    return res.json({ bar: parseInt(req.params.bar,10) });
  });
  // fire request
  agent.get('/api/foo/1')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.bar.should.equal(1);
      done();
    });
});

it('should be able to add PUT handlers', function(done) {
  // add a dummy put service
  rest.put('/foo/:bar', function(req, res, next) {
    res.statusCode = 200;
    return res.json({ bar: parseInt(req.params.bar,10) });
  });

  // fire request
  agent.put('/api/foo/1')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.bar.should.equal(1);
      done();
    });
});

it('should be able to add DELETE handlers', function(done) {
  // add a dummy delete service
  rest.delete('/foo/:bar', function(req, res, next) {
    res.statusCode = 200;
    return res.json({ bar: parseInt(req.params.bar,10) });
  });
  // fire request
  agent.del('/api/foo/1')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.bar.should.equal(1);
      done();
    });
});
