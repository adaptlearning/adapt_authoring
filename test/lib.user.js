var path = require('path'),
    user = require('../lib/user.js'),
    builder = require('../');

describe('user', function(){
  var userRec = {
    email: "foo@bar.com",
    active: true
  };

  // ensure the user record is deleted
  after (function () {
    user.retrieveUser({ email: userRec.email }, function (error, record) {
      if (error) {
        done(error)
      } else if (record) {
        user.deleteUser(userRec, function(error) {
          if (error) {
            throw error;
          }
        });
      }
    });
  });

  it ('should allow the creation of a new user', function(done) {
    user.createUser(userRec, done);
  });

  it ('should allow the retrieval of a single user', function(done) {
    user.retrieveUser({ email: userRec.email }, function (error, record) {
      if (error) {
        done(error);
      } else if (record) {
        done();
      } else {
        done(new Error('Failed to retrieve user record'));
      }
    });
  });

  it ('should allow updating of a user', function(done) {
    user.updateUser({ email: userRec.email }, { active: false } , function (error, result) {
      if (error) {
        done(error);
      } else {
        // verify that the update occurred
        user.retrieveUser({ email: userRec.email }, function (error, record) {
          if (!record.active) { // it worked
            done();
          } else {
            done(new Error('Failed to update user'));
          }
        });
      }
    });
  });

  it ('should allow the deleting of users', function(done) {
    user.deleteUser( { email: userRec.email }, function (error) {
      if (error) {
        done(error);
      } else {
        // verify the user was deleted
        user.retrieveUser({ email: userRec.email }, function (error, record) {
          if (!record) { // it worked
            done();
          } else {
            done(new Error('Failed to delete user'));
          }
        });
      }
    });
  });
});
