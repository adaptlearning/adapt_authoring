var builder = require('../'),
    content = require('../lib/contentmanager'),
    database = require('../lib/database'),
    auth = require('../lib/auth'),
    usermanager = require('../lib/usermanager'),
    request = require('supertest'),
    should = require('should');

describe('contentmanager', function() {
  var app = builder();
  var agent = {};
  var contentObj = {};

  before (function (done) {
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

  after (function (done) {
    // cleanup
    if (contentObj._id) {
      database.getDatabase(function(err, db){
        if(err){
          return done(err);
        }
        
        db.destroy('course', { _id: contentObj._id }, done);
      });
    }
  });

  it ('should allow me to create some content', function (done) {
    agent
      .put('/api/content/course')
      .set('Accept', 'application/json')
      .send({
        name: 'some name'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        contentObj = res.body;
        should.exist(contentObj._id);
        return done();
      });
  });

  it ('should be unsuccessful when attempting to create some unknown content type', function (done) {
    agent
      .put('/api/content/iwillneverbeacontenttype')
      .set('Accept', 'application/json')
      .send({
        name: 'some name'
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.success.should.be.false;
        return done();
      });
  });

  it ('should allow me to retrieve a content item by id', function (done) {
    agent
      .get('/api/content/course/' + contentObj._id)
      .set('Accept', 'application/json')
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        should.exist(res.body._id);
        res.body._id.should.equal(contentObj._id);
        return done();
      });
  });

  it ('should allow me to retrieve an array of content items', function (done) {
    agent
      .get('/api/content/courses')
      .set('Accept', 'application/json')
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.length.should.be.above(0);
        return done();
      });
  });

  it ('should allow me to update a content item', function (done) {
    agent
      .post('/api/content/course/' + contentObj._id)
      .set('Accept', 'application/json')
      .send({
        name: "some different name"
       })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.success.should.be.true;
        return done();
      });
  });

});
