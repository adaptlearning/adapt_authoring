var async = require('async');
var fs = require('fs');
var request = require('supertest');
var should = require('should');

var origin = require('../');
var assetmanager = require('../lib/assetmanager');

var testData = require('./testData.json');
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
      email: testData.testUser.email,
      password: testData.testUser.plainPassword
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
      done();
    });
});

it('should allow requests to query assets', function(done) {
  // create lots of assets for us to query
  async.each([
    { title: 'yourasset.php' },
    { title: 'herasset.txt' },
    { title: 'hisasset.txt' }
  ], postAsset, function(error) {
    should.not.exist(error);
    agent
      .get('/api/asset/query')
      .send({ search: { title: '\.txt$' } })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(error, res) {
        should.not.exist(error);
        should.exist(res.body);
        res.body.length.should.equal(2, 'Expected 2 results, got ' + res.body.length);
        done();
      });
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

it('should allow requests to hard-delete an asset', function(done) {
  // might as well remove them all while we're here
  async.each(assetIds, deleteAsset, done);
});

it('should allow requests to rebuild asset thumbnails', function(done) {
  agent
    .post('/api/asset/buildthumbs')
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

it('should allow requests to store workspace data', function(done) {
  agent
    .post('/api/asset/syncworkspaces')
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

function postAsset(assetData, cb) {
  if(typeof assetData === 'function') {
    cb = assetData;
    assetData = {};
  }
  agent
    .post('/api/asset')
    .field('title', assetData.title || 'Temporary Asset')
    .field('description', assetData.description || 'A temporary asset')
    .field('repository', assetData.repo || 'localfs')
    .attach('file', assetData.file || __filename)
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
