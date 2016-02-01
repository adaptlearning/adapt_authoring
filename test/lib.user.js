var path = require('path'),
    usermanager = require('../lib/usermanager.js'),
    origin = require('../');

describe('usermanager', function(){
  var user = {
    email: "foo@bar.com",
    auth: 'local',
    _isDeleted: false
  };

  var userReset = {
    email: user.email,
    token: "testtokentesttokentesttokentest1",
    tokenCreated: new Date(),
    ipAddress: '127.0.0.1',
    issueDate: new Date()
  };

  // ensure the user record is deleted
  after (function (done) {
    usermanager.retrieveUser({ email: user.email }, function (error, record) {
      if (error) {
        return done(error);
      }

      usermanager.deleteUser(user, function(error) {
        if (error) {
          return done(error);
        }
        usermanager.retrieveUserPasswordReset({ token: userReset.token }, function (error, record) {
          if (error) {
            return done(error);
          }

          usermanager.deleteUserPasswordReset({user:record.id}, function(error) {
            if (error) {
              return done(error);
            }

            return done();
          });
        });
      });
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

  it ('should allow the creation of a user password reset', function(done) {
    usermanager.createUserPasswordReset(userReset, function (error) {
      if (error) {
        done(error);
      } else {
        // verify the user password reset was created
        usermanager.retrieveUserPasswordReset({ token: userReset.token }, function (error, record) {
          if (record) {
            done();
          } else {
            done(new Error('Failed to create user password reset'));
          }
        });
      }
    });
  });

  it ('should allow the retrieval of a single user password reset', function(done) {
    usermanager.retrieveUserPasswordReset({ token: userReset.token }, function (error, record) {
      if (error) {
        done(error);
      } else if (record) {
        done();
      } else {
        done(new Error('Failed to retrieve user password reset record'));
      }
    });
  });

  it ('should allow the deletion of a user password reset', function(done) {
    usermanager.retrieveUser({ email: user.email }, function (error, record) {
      if (error) {
        done(error);
      } else if (record) {
        // Remove reset request
        usermanager.deleteUserPasswordReset({user:record.id}, function (error, user) {
          if (error) {
            return done(error);
          }
          // Ensure reset request was deleted
          usermanager.retrieveUserPasswordReset({ token: userReset.token }, function (error, resetRecord) {
            if (!resetRecord) {
              done();
            } else {
              done(new Error('Failed to delete user password reset'));
            }
          });
        });
      } else {
        done(new Error('Failed to retrieve user record'));
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
