var should = require('should');
var request = require('supertest');

var origin = require('../');
var auth = require('../lib/auth');
var usermanager = require('../lib/usermanager');

var testData = require('./testData.json');
var app = origin();

var helper = {
  passwordCipher: '',
  userId: '',
  userAgent: {},
};

before (function(done) {
  // store the agent to use cookies
  helper.userAgent = request.agent(app.getServerURL());
  done();
});

after (function(done) {
  if (!helper.userId) return done();
  usermanager.deleteUser({ email: testData.auth.email }, function(error) {
    if (error) return done(error);
    usermanager.retrieveUserPasswordReset({ token: testData.auth.token }, function(error, record) {
      if (error) return done(error);
      usermanager.deleteUserPasswordReset({user:record.id}, done);
    });
  });
});

it('should be able to hash a password', function(done) {
  auth.hashPassword(testData.auth.passwordPlain, function(error, hash) {
    should.not.exist(error);
    helper.passwordCipher = hash;
    done();
  });
});

it('should validate a correct password', function(done) {
  auth.validatePassword(testData.auth.passwordPlain, helper.passwordCipher, function(error, valid) {
    should.not.exist(error);
    valid.should.be.true;
    done();
  });
});

it('should not validate an incorrect password', function(done) {
  auth.validatePassword('this is not my password', helper.passwordCipher, function(error, valid) {
    should.not.exist(error);
    valid.should.not.be.true;
    done();
  });
});

it('should accept requests to register a user with the default auth strategy', function(done) {
  helper.userAgent
    .post('/api/register')
    .set('Accept', 'application/json')
    .send({
      'email': testData.auth.email,
      'password': testData.auth.passwordPlain
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.exist(res.body);
      should.exist(res.body.email);
      should.exist(res.body._id);
      res.body.email.should.equal(testData.auth.email);
      helper.userId = res.body._id;
      // we need to set the tenant
      app.usermanager.updateUser({ _id: helper.userId }, { _tenantId: app.configuration.getConfig('masterTenantID') }, done);
    });
});

it('should accept authenticated requests to create a user session', function(done) {
  helper.userAgent
    .post('/api/login')
    .set('Accept', 'application/json')
    .send({
      'email': testData.auth.email,
      'password': testData.auth.passwordPlain
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      done();
    });
});

it('should reject a user with an incorrect login', function(done) {
  helper.userAgent
    .post('/api/login')
    .set('Accept', 'application/json')
    .send({
      'email': 'nobody@nowhere.com',
      'password': '12345'
    })
    .expect(401)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      done();
    });
});

// TODO not sure what this functionality's for
it('should accept authenticated requests to log in as another user', function(done) {
  helper.userAgent
    .post('/api/loginas')
    .set('Accept', 'application/json')
    .send({
      "email": testData.testUser.email,
      "password": testData.testUser.plainPassword
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.success.should.be.true;
      helper.userId = res.body.id;
      done();
    });
});

it('should accept requests to verify if a user is authenticated', function(done) {
  helper.userAgent
    .get('/api/authcheck')
    .send()
    .expect(200)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.id.should.equal(helper.userId);
      done();
    });
});

it('should be able to generate a random token', function(done) {
  auth.createToken(function(error, token) {
    should.not.exist(error);
    token.should.have.lengthOf(24);
    done();
  });
});

it('should accept requests to create a password reset token', function(done) {
  helper.userAgent
    .post('/api/createtoken')
    .set('Accept', 'application/json')
    .send({ 'email': testData.auth.email })
    .expect(200)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.success.should.be.true;
      done();
    });
});

it('should accept requests to reset a user\'s password', function(done) {
  helper.userAgent
    .post('/api/userpasswordreset/' + testData.auth.token)
    .set('Accept', 'application/json')
    .send({
      'user': helper.userId,
      'password': testData.testUser.newpassword,
      'token': testData.auth.token
    })
    .expect(200)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.success.should.be.true;
      done();
    });
});

it('should accept requests to end a user session', function(done) {
  helper.userAgent
    .post('/api/logout')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(error, res) {
      should.not.exist(error);
      res.body.success.should.be.true;
      done();
    });
});
