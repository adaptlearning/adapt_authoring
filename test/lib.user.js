var path = require('path'),
    usermanager = require('../lib/usermanager.js'),
    origin = require('../');

describe('usermanager', function(){
  var user = {
    email: "foo@bar.com",
    _isDeleted: false
  };

  // ensure the user record is deleted
  after (function () {
    usermanager.retrieveUser({ email: user.email }, function (error, record) {
      if (error) {
        done(error)
      } else if (record) {
        usermanager.deleteUser(user, function(error) {
          if (error) {
            throw error;
          }
        });
      }
    });
  });

  it ('should allow the creation of a new user', function(done) {
    usermanager.createUser(user, done);
  });

  it ('should allow the retrieval of a single user', function(done) {
    usermanager.retrieveUser({ email: user.email }, function (error, record) {
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
    usermanager.updateUser({ email: user.email }, { _isDeleted: true } , function (error, result) {
      if (error) {
        done(error);
      } else {
        // verify that the update occurred
        usermanager.retrieveUser({ email: user.email }, function (error, record) {
          if (record._isDeleted) { // it worked
            done();
          } else {
            done(new Error('Failed to update user'));
          }
        });
      }
    });
  });

  it ('should allow the deleting of users', function(done) {
    usermanager.deleteUser( { email: user.email }, function (error) {
      if (error) {
        done(error);
      } else {
        // verify the user was deleted
        usermanager.retrieveUser({ email: user.email }, function (error, record) {
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
