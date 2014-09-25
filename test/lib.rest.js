var rest = require('../lib/rest'),
    logger = require('../lib/logger'),
    permissions = require('../lib/permissions'),
    origin = require('../'),
    should = require('should'),
    request = require('supertest');

describe('rest', function() {
  var app = origin();
  var agent = {};

  before (function (done) {
    // we don't care about authentication here, so ignore routes
    permissions.ignoreRoute(/^\/api\/.*/);
    agent = request.agent(app.getServerURL());
    done();
  });

  it ('should allow the addition of a put handler', function (done) {
    // add a dummy put service
    rest.put('/foo/:bar', function (req, res, next) {
      res.statusCode = 200;
      return res.json({ bar: parseInt(req.params.bar,10) });
    });

    // fire request
    agent.put('/api/foo/1')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        res.body.bar.should.equal(1);
        done();
      });
  });

  it ('should allow the addition of a get handler', function (done) {
    // add a dummy get service
    rest.get('/foo/:bar', function (req, res, next) {
      res.statusCode = 200;
      return res.json({ bar: parseInt(req.params.bar,10) });
    });

    // fire request
    agent.get('/api/foo/1')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        res.body.bar.should.equal(1);
        done();
      });
  });

  it ('should allow the addition of a post handler', function (done) {
    // add a dummy post service
    rest.post('/foo/:bar', function (req, res, next) {
      res.statusCode = 200;
      return res.json({ bar: parseInt(req.params.bar,10) });
    });

    // fire request
    agent.post('/api/foo/1')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        res.body.bar.should.equal(1);
        done();
      });
  });

  it ('should allow the addition of a delete handler', function (done) {
    // add a dummy delete service
    rest.delete('/foo/:bar', function (req, res, next) {
      res.statusCode = 200;
      return res.json({ bar: parseInt(req.params.bar,10) });
    });

    // fire request
    agent.del('/api/foo/1')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        res.body.bar.should.equal(1);
        done();
      });
  });
});
