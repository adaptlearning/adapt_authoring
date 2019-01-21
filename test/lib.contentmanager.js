var async = require('async');
var request = require('supertest');
var should = require('should');

var origin = require('../');
var auth = require('../lib/auth');
var database = require('../lib/database');

var testData = require('./testData.json');
var app = origin();

var agent = {};
var userId = false;
var contentObj = {};
var otherContentObj = {};
var content = app.contentmanager;

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
    .end(function(error, res) {
      if(error) return done(error);
      userId = res.body.id;
      done();
    });
});

after(function(done) {
  if(contentObj._id) {
    database.getDatabase(function(error, db) {
      if(error) return done(error);
      db.destroy('course', { _id: contentObj._id }, function(error) {
        db.destroy('course', { _id: otherContentObj._id }, done);
      });
    }, app.configuration.getConfig('dbName'));
  }
});

it('should accept requests to create content', function(done) {
  agent
    .post('/api/content/course')
    .set('Accept', 'application/json')
    .send({
      title: 'some name',
      body: 'lorem ispum',
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      contentObj = res.body;
      should.exist(contentObj._id);
      // create some more content
      agent
      .post('/api/content/course')
      .set('Accept', 'application/json')
      .send({
        title: 'a title',
        body: 'no body here',
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(error, res) {
        should.not.exist(error);
        otherContentObj = res.body;
        should.exist(otherContentObj._id);
        return done();
      });
    });
});

it('should reject requests to create unknown content types', function(done) {
  agent
    .post('/api/content/iwillneverbeacontenttype')
    .set('Accept', 'application/json')
    .send({ title: 'some name' })
    .expect(400)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.success.should.be.false;
      return done();
    });
});

it('should accept requests to retrieve content by id', function(done) {
  agent
    .get('/api/content/course/' + contentObj._id)
    .set('Accept', 'application/json')
    .send()
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      should.exist(res.body._id);
      res.body._id.should.equal(contentObj._id);
      return done();
    });
});

it('should accept requests to retrieve multiple content items', function(done) {
  agent
    .get('/api/content/course')
    .set('Accept', 'application/json')
    .send()
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.length.should.be.above(0);
      return done();
    });
});

it('should accept requests to retrieve multiple content items filtered by a regex query', function(done) {
  agent
    .get('/api/content/course/query')
    .set('Accept', 'application/json')
    .send({ search: { body: { $regex: '^lorem' } } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.length.should.be.above(0);
      return done();
    });
});

it('should accept requests to retrieve multiple content items with a field less-than-or-equal to a value', function(done) {
  agent
    .get('/api/content/course/query')
    .set('Accept', 'application/json')
    .send({ search: { createdAt: { $lte: new Date() } } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.length.should.be.above(0);
      return done();
    });
});

it('should accept requests to retrieve content with a custom-populated subdocument', function(done) {
  agent
    .get('/api/content/course/query')
    .set('Accept', 'application/json')
    .send({ populate: { 'createdBy': ['_id', 'email'] } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.length.should.be.above(0);
      if(res.body[0].createdBy === null) {
        throw new Error('Sub-document not populated');
      }
      res.body[0].createdBy._id.should.equal(userId, 'Invalid _id specified');
      return done();
    });
});

it('should accept requests to retrieve only desired content attributes', function(done) {
  agent
    .get('/api/content/course/query')
    .set('Accept', 'application/json')
    .send({ fields: { title: 1 } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.length.should.be.above(0);
      /*
      * _id is returned by default
      * Tags are returned as result of population, see https://github.com/adaptlearning/adapt_authoring/blob/dc04351192d62c6e6f6520e33eee1478a01d672d/lib/contentmanager.js#L191-L197
      */
      var bodyKeys = Object.keys(res.body[0]);
      bodyKeys.length.should.equal(3);
      bodyKeys.should.containEql('title');
      done();
    });
});

it('should accept requests to retrieve a sorted list of content items', function(done) {
  agent
    .get('/api/content/course/query')
    .set('Accept', 'application/json')
    .send({ operators: { sort: { 'createdAt': -1 } } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      for(var i = 1, count = res.body.length; i < count; i++) {
        res.body[i].createdAt.should.be.below(res.body[i-1].createdAt);
      }
      done();
    });
});

it('should accept requests to retrieve a limited number of content items', function(done) {
  agent
    .get('/api/content/course/query')
    .set('Accept', 'application/json')
    .send({ operators: { limit: 1 } })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.length.should.equal(1);
      return done();
    });
});

it('should accept requests to update a content item', function(done) {
  agent
    .put('/api/content/course/' + contentObj._id)
    .set('Accept', 'application/json')
    .send({ title: "some different name" })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.success.should.be.true;
      return done();
    });
});

// only applies to course/contentobject/article
it('should accept cascading delete requests for supported content', function(done) {
  var pageContent = false; // will retain our contentobject _id for assertion
  async.series([
    function(next) {
      agent
        .post('/api/content/contentobject')
        .set('Accept', 'application/json')
        .send({
          _parentId: contentObj._id,
          _courseId: contentObj._id,
          title: "A Page",
          body: "A Page Body"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(error, res) {
          should.not.exist(error);
          should.exist(res.body._id);
          pageContent = res.body;
          return next(null);
        });
    },
    // delete the course
    function(next) {
      agent
        .del('/api/content/course/' + contentObj._id)
        .set('Accept', 'application/json')
        .send()
        .expect(200)
        .end(function(res) {
          return next(null);
        });
    },
    // check that the pageContent was also deleted
    function(next) {
      agent
        .get('/api/content/contentobject/' + pageContent._id)
        .send()
        .expect(404)
        .end(function(res) {
          return next(null);
        });
    }
  ], done);
});
