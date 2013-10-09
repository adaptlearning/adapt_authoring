var builder = require('../'),
    mongoose = require('mongoose'),
    database = require('../lib/database');

describe('database', function() {
  before(function(){
    var db = database.getDatabase();
    db.addModel('foo', mongoose.Schema({ email: String }));
  });

  it ('should allow me to insert a new object', function(done) {
    var db = database.getDatabase();
    db.create('foo', { email: "foo@bar.com" }, done);
  });
  
  it ('should allow me to retrieve that object', function(done) {
    var db = database.getDatabase();
    db.retrieve('foo', { email: "foo@bar.com" }, done);
  });
  
  it ('should allow me to update an object', function(done) {
    var db = database.getDatabase();
    db.retrieve('foo', { email: "foo@bar.com" }, function (error, results) {
      if (error) {
        done(error);
      } else if (results && results.length) {
        var obj = results[0];
        db.update('foo', { _id: obj._id }, { email: "bar@foo.com" }, done);
      } else {
        done(new Error('Expected result was not retrieved'));
      }
    });
  });
  
  it ('should allow me to delete an object', function(done) {
    var db = database.getDatabase();
    db.retrieve('foo', { email: "bar@foo.com" }, function (error, results) {
      if (error) {
        done(error);
      } else if (results && results.length) {
        var obj = results[0];
        db.destroy('foo', { _id: obj._id }, done);
      } else {
        done(new Error('Expected result was not retrieved'));
      }
    });
  });

});
