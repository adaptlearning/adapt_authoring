var mongoose = require('mongoose');
var should = require('should');

var testData = require('./testData.json').database;
var origin = require('../');

var app = origin();

before(function() {
  app.db.addModel(testData.model, { properties: { email: {  type: 'string' } }  });
});

it('should be able to insert new objects', function(done) {
  app.db.create(testData.model, { email: testData.email }, done);
});

it('should be able to retrieve stored objects', function(done) {
  app.db.retrieve(testData.model, { email: testData.email }, done);
});

it('should be able to update stored objects', function(done) {
  app.db.retrieve(testData.model, { email: testData.email }, function(error, results) {
    should.not.exist(error);
    results.length.should.be.above(0, 'Expected result was not retrieved');
    var obj = results[0];
    app.db.update(testData.model, { _id: obj._id }, { email: testData.altEmail }, done);
  });
});

it('should be able to delete stored objects', function(done) {
  app.db.retrieve(testData.model, { email: testData.altEmail }, function(error, results) {
    should.not.exist(error);
    results.length.should.be.above(0, 'Expected result was not retrieved');
    var obj = results[0];
    app.db.destroy(testData.model, { _id: obj._id }, done);
  });
});
