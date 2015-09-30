var origin = require('../'),
    database = require('../lib/database'),
    auth = require('../lib/auth'),
    usermanager = require('../lib/usermanager'),
    request = require('supertest'),
    should = require('should'),
    async = require('async');

describe('contentmanager', function() {
  var app = origin();
  var agent = {};
  var userId = false;
  var contentObj = {};
  var otherContentObj = {};
  var content = app.contentmanager;

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
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        userId = res.body.id;
        done();
      });
  });

  after (function (done) {
    // cleanup
    if (contentObj._id) {
      database.getDatabase(function(err, db){
        if(err){
          return done(err);
        }

        db.destroy('course', { _id: contentObj._id }, function (error) {
          db.destroy('course', { _id: otherContentObj._id }, done);
        });
      }, configuration.getConfig('dbName'));
    }
  });

  it ('should allow me to create some content', function (done) {
    agent
      .post('/api/content/course')
      .set('Accept', 'application/json')
      .send({
        title: 'some name',
        body: 'lorem ispum',
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

  it ('should allow me to create some more content', function (done) {
    agent
      .post('/api/content/course')
      .set('Accept', 'application/json')
      .send({
        title: 'a title',
        body: 'no body here',
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        otherContentObj = res.body;
        should.exist(otherContentObj._id);
        return done();
      });
  });

  it ('should be unsuccessful when attempting to create some unknown content type', function (done) {
    agent
      .post('/api/content/iwillneverbeacontenttype')
      .set('Accept', 'application/json')
      .send({
        title: 'some name'
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
      .get('/api/content/course')
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

  it ('should allow me to retrieve an array of content items by searching with a regex query', function (done) {
    agent
      .get('/api/content/course/query')
      .set('Accept', 'application/json')
      .send({
        search: { body: { $regex: '^lorem' } }
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.length.should.equal(1);
        return done();
      });
  });

  it ('should allow me to retrieve an array of content items with a field less-than-or-equal to another value', function (done) {
    agent
      .get('/api/content/course/query')
      .set('Accept', 'application/json')
      .send({
        search: { createdAt: { $lte: new Date() } }
      })
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

  it ('should allow me to populate a subdocument and select only desired attributes', function (done) {
    agent
      .get('/api/content/course/query')
      .set('Accept', 'application/json')
      .send({
        populate: { createdBy: [ 'email', '_id' ] }
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.length.should.be.above(0);
        res.body[0].createdBy._id.should.equal(userId);
        return done();
      });
  });

  it ('should allow me to sort a retrieved collection on a field in descending order', function (done) {
    agent
      .get('/api/content/course/query')
      .set('Accept', 'application/json')
      .send({
        operators: { sort: { 'createdAt': -1 } }
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.length.should.equal(2);
        res.body[0].createdAt.should.be.above(res.body[1].createdAt);
        return done();
      });
  });

  it ('should allow me to limit the number of items retrieved from a collection', function (done) {
    agent
      .get('/api/content/course/query')
      .set('Accept', 'application/json')
      .send({
        operators: { limit: 1 }
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        if (error) {
          return done(error);
        }

        res.body.length.should.equal(1);
        return done();
      });
  });

  it ('should allow me to update a content item', function (done) {
    agent
      .put('/api/content/course/' + contentObj._id)
      .set('Accept', 'application/json')
      .send({
        title: "some different name"
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

  it ('should allow cascading deletes for content that supports it (course/contentobject/article)', function (done) {
    var pageContent = false; // will retain our contentobject _id for assertion
    async.series([
      function (next) {
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
          .end(function (error, res) {
            // retain id
            should.exist(res.body._id);
            pageContent = res.body;
            return next(null);
          });
      },
      function (next) {
        // delete the course
        agent
          .del('/api/content/course/' + contentObj._id)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end(function (res) {
            return next(null);
          });
      },
      function (next) {
        // check that the pageContent was also deleted
        agent
          .get('/api/content/contentobject/' + pageContent._id)
          .send()
          .expect(404)
          .end(function (res) {
            return next(null);
          });
      }
    ],
    done);
  });

});
