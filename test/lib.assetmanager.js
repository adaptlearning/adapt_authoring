var async = require('async');
var fs = require('fs');
var request = require('supertest');
var should = require('should');

var origin = require('../');
var assetmanager = require('../lib/assetmanager');

var testUser = require('./testData.json').testUser;
var testData = require('./testData.json').assetmanager;

var app = origin();

var agent = {};
var assetIds = [];

before(function(done) {
  agent = request.agent(app.getServerURL());
  // need to authenticate
  agent
    .post('/api/login')
    .set('Accept', 'application/json')
    .send({
      email: testUser.email,
      password: testUser.plainPassword
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(done);
});

it('should allow requests to create an new asset', function(done) {
  postAsset(done);
});

it('should allow requests to retrieve an asset', function(done) {
  agent
    .get('/api/asset/' + assetIds[0])
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      res.body.title.should.equal('Temporary Asset');
      testData.asset = res.body;
      done();
    });
});

it('should allow requests to query assets', function(done) {
  // test by file extension to be a bit more generic
  var fileExtension = testData.asset.filename.split('.').pop();
  agent
    .get('/api/asset/query')
    .send({ search: { filename: `\.${fileExtension}$` } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      res.body.length.should.equal(1, 'Expected 1 result, got ' + res.body.length);
      done();
    });
});

it('should allow requests to serve an asset', function(done) {
  agent
    .get('/api/asset/serve/' + assetIds[0])
    .expect(200)
    .expect('Content-Type', /javascript/, done);
});

it('should allow requests to serve an asset thumbnail', function(done) {
  agent
    .get('/api/asset/thumb/' + assetIds[0])
    .expect(200)
    .expect('Content-Type', /image/, done);
});


it('should allow requests to update an asset', function(done) {
  agent
    .put('/api/asset/' + assetIds[0])
    .field('title', 'Updated Temporary Asset')
    .attach('file', __filename)
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      should.exist(res.body.success);
      res.body.success.should.be.true;
      done();
    });
});

it('should allow requests to soft-delete an asset', function(done) {
  agent
    .put('/api/asset/trash/' + assetIds[0])
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      should.exist(res.body.success);
      res.body.success.should.be.true;
      done();
    });
});

it('should allow requests to restore a soft-deleted asset', function(done) {
  agent
    .put('/api/asset/restore/' + assetIds[0])
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      should.exist(res.body.success);
      res.body.success.should.be.true;
      done();
    });
});

function postAsset(cb) {
  agent
    .post('/api/asset')
    .field('title', testData.asset.title)
    .field('description', testData.asset.description)
    .field('repository', testData.asset.repo)
    .attach('file', __filename)
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      should.exist(res.body._id);
      assetIds.push(res.body._id);
      cb();
    });
}

function deleteAsset(assetId, cb) {
  agent
    .del('/api/asset/' + assetId)
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body);
      should.exist(res.body.success);
      res.body.success.should.be.true;
      cb();
    });
}
