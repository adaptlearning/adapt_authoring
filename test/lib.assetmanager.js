var origin = require('../'),
    assetmanager = require('../lib/assetmanager'),
    request = require('supertest'),
    should = require('should');

describe ('assetmanager', function () {
  var app = origin();
  var agent = {};
  var assetId = false;

  before (function (done){
    agent = request.agent(app.getServerURL());

    // need to authenticate
    agent
      .post('/api/login')
      .set('Accept', 'application/json')
      .send({
        email: 'testuser@adapt.org', // created in test/lib.application.js
        password: 'password'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(done);
  });

  it ('should allow storing of a multimedia resource', function (done) {
    agent
      .post('/api/asset')
      .field('title', 'Temporary Asset')
      .field('description', 'A temporary asset')
      .field('repository', 'localfs')
      .field('path', 'myasset.js')
      .attach('file', __filename)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        should.exist(res.body);
        should.exist(res.body._id);
        assetId = res.body._id;
        done();
      });
  });

  it ('should allow retrieval of a multimedia resource', function (done) {
    agent
      .get('/api/asset/' + assetId)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        should.exist(res.body);
        res.body.title.should.equal('Temporary Asset');
        done();
      });
  });

  it ('should allow updating of a multimedia resource', function (done) {
    agent
      .put('/api/asset/' + assetId)
      .field('title', 'Updated Temporary Asset')
      .attach('file', __filename)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        should.exist(res.body);
        should.exist(res.body.success);
        res.body.success.should.be.true;
        done();
      });
  });

  it ('should allow deleting of a multimedia resource', function (done) {
    agent
      .del('/api/asset/' + assetId)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        should.exist(res.body);
        should.exist(res.body.success);
        res.body.success.should.be.true;
        done();
      });
  });
});
