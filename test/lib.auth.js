var should = require('should'),
    origin = require('../'),
    request = require('supertest'),
    usermanager = require('../lib/usermanager'),
    auth = require('../lib/auth');

describe('auth', function() {
  var app = origin();
  var helper = {
    passwordPlain: 'this is my password',
    passwordCipher: '',
    email: 'auth@foo.bar',
    userId: '',
    userAgent: {},
    token: "testtokentesttokentesttokentest1",
    newPassword: 'newpassword'
  };

  before (function (done) {
    // retaining a reference to the agent allows us to
    // take advantage of cookies
    helper.userAgent = request.agent(app.getServerURL());
    done();
  });

  after (function (done) {
    // cleanup
    if (helper.userId) {
      usermanager.deleteUser({ _id: helper.userId }, function (err) {
        usermanager.retrieveUserPasswordReset({ token: helper.token }, function (error, record) {
          if (error) {
            return done(error)
          }

          usermanager.deleteUserPasswordReset({user:record.id}, function(error) {
            if (error) {
              return done(error);
            }

            return done();
          });
        });
      });
    } else {
      done();
    }
  });

  it ('should hash a password', function (done) {
    auth.hashPassword(helper.passwordPlain, function (error, hash) {
      should.not.exist(error);
      helper.passwordCipher = hash;
      done();
    });
  });

  it ('should validate a correct password', function (done) {
    auth.validatePassword(helper.passwordPlain, helper.passwordCipher, function (error, valid) {
      should.not.exist(error);
      valid.should.be.true;
      done();
    });
  });

  it ('should not validate an incorrect password', function (done) {
    auth.validatePassword('this is not my password', helper.passwordCipher, function (error, valid) {
      should.not.exist(error);
      valid.should.not.be.true;
      done();
    });
  });

  it ('should allow me to register a user with default auth strategy', function (done) {
    helper.userAgent
      .post('/api/register')
      .set('Accept', 'application/json')
      .send({
        'email': helper.email,
        'password': helper.passwordPlain
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.exist(res.body);
        should.exist(res.body.email);
        should.exist(res.body._id);
        res.body.email.should.equal(helper.email);
        helper.userId = res.body._id;

        // having registered a user, we need to set the tenant
        app.usermanager.updateUser({ _id: helper.userId }, { _tenantId: app.configuration.getConfig('masterTenantID') }, done);
      });
  });

  it ('should create a user session with a correct login', function (done) {
    helper.userAgent
      .post('/api/login')
      .set('Accept', 'application/json')
      .send({
        'email': helper.email,
        'password': helper.passwordPlain
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        done();
      });
  });

  it ('should verify that an authenticated user is authenticated', function (done) {
    helper.userAgent
      .get('/api/authcheck')
      .send()
      .expect(200)
      .end(function (error, res) {
        should.not.exist(error);
        done();
      });
  });

  it ('should reject a user with an incorrect login', function (done) {
    helper.userAgent
      .post('/api/login')
      .set('Accept', 'application/json')
      .send({
        'email': 'nobody@nowhere.com',
        'password': '12345'
      })
      .expect(401)
      .expect('Content-Type', /json/)
      .end(function (error, res) {
        should.not.exist(error);
        done();
      });
  });

  it ('should generate a token', function (done) {
    auth.createToken(function (error, token) {
      should.not.exist(error);
      token.should.have.lengthOf(24);
      done();
    });
  });

  it ('should accept requests to create a token', function (done) {
    helper.userAgent
      .post('/api/createtoken')
      .set('Accept', 'application/json')
      .send({
        'email': helper.email
      })
      .expect(200)
      .end(function (error, res) {
        should.not.exist(error);
        done();
      });
  });

  // @TODO something a bit funky about this test, needs revisiting
  //
  // it ('should reset a users password', function (done) {
  //   // Manually pass in a reset request
  //   var userReset = {
  //     email: helper.email,
  //     token: helper.token,
  //     tokenCreated: new Date(),
  //     ipAddress: '127.0.0.1'
  //   };
  //
  //   usermanager.createUserPasswordReset(userReset, function (error) {
  //     if (error) {
  //       return done(error);
  //     }
  //
  //     // Reset the users password
  //     helper.userAgent
  //       .post('/api/resetpassword')
  //       .set('Accept', 'application/json')
  //       .send({
  //         'user': helper.userId,
  //         'password': helper.newPassword,
  //         'token': userReset.token
  //       })
  //       .expect(200)
  //       .end(function (error, res) {
  //         should.not.exist(error);
  //
  //         // Should allow user to login with the new password
  //         helper.userAgent
  //           .post('/api/login')
  //           .set('Accept', 'application/json')
  //           .send({
  //             'email': helper.email,
  //             'password': helper.newPassword
  //           })
  //           .expect(200)
  //           .expect('Content-Type', /json/)
  //           .end(function (error, res) {
  //             should.not.exist(error);
  //             done();
  //           });
  //         });
  //     });
  //   });
});
