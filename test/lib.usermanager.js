var path = require('path');
var should = require('should');

var usermanager = require('../lib/usermanager.js');

var testData = require('./testData.json').usermanager;

var userReset = {
  email: testData.user.email,
  token: testData.token,
  tokenCreated: new Date(),
  ipAddress: testData.ipAddress,
  issueDate: new Date()
};

// ensure the user record is deleted
after(function(done) {
  usermanager.retrieveUser({ email: testData.user.email }, function(error, record) {
    if(error) return done(error);
    usermanager.deleteUser(record, function(error) {
      if(error) return done(error);
      usermanager.retrieveUserPasswordReset({ token: userReset.token }, function(error, record) {
        if(error) return done(error);
        usermanager.deleteUserPasswordReset({ user: record.id }, done);
      });
    });
  });
});

it('should be able to create new users', function(done) {
  usermanager.createUser(testData.user, function(error, user) {
    should.not.exist(error);
    should.exist(user);
    user.email.should.equal(testData.user.email);
    userReset.user = user._id;
    done();
  });
});

it('should be able to retrieve a single user', function(done) {
  usermanager.retrieveUser({ email: testData.user.email }, function(error, record) {
    should.not.exist(error);
    should.exist(record, 'Failed to retrieve user record');
    done();
  });
});

it('should be able to update existing users', function(done) {
  usermanager.updateUser({ email: testData.user.email }, { _isDeleted: true } , function(error, result) {
    should.not.exist(error);
    usermanager.retrieveUser({ email: testData.user.email }, function(error, record) {
      if(record._isDeleted.should.equal(true, 'Failed to update user'));
      done();
    });
  });
});

it('should be able to create a user password reset', function(done) {
  usermanager.createUserPasswordReset(userReset, function(error, resetData) {
    should.not.exist(error);
    resetData.token.should.equal(userReset.token);
    done();
  });
});

it('should be able to retrieve a user password reset', function(done) {
  usermanager.retrieveUserPasswordReset({ token: userReset.token }, function(error, record) {
    should.not.exist(error);
    should.exist(record, 'Failed to retrieve user password reset record');
    done();
  });
});

it('should be able to delete a user password reset', function(done) {
  usermanager.deleteUserPasswordReset({ user: userReset.user }, function(error, user) {
    should.not.exist(error);
    // Ensure reset request was deleted
    usermanager.retrieveUserPasswordReset({ token: userReset.token }, function(error, resetRecord) {
      should.not.exist(error);
      resetRecord.should.equal(false, 'Failed to delete user password reset');
      done();
    });
  });
});

it('should be able to delete users', function(done) {
  usermanager.deleteUser( { email: testData.user.email }, function(error) {
    should.not.exist(error);
    // verify the user was deleted
    usermanager.retrieveUser({ email: testData.user.email }, function(error, userRecord) {
      should.not.exist(error);
      userRecord.should.equal(false, 'Failed to delete user');
      done();
    });
  });
});
