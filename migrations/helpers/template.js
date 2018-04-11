'use strict';

var database = require('./../../lib/database');
var helpers = require('./../../migrations/helpers/helper');
var configuration = require('./../../lib/configuration');

exports.up = function up (done) {
  helpers.start(function() {
    database.getDatabase(function(err, db) {
      if (err) {
        done(err)
      }

      //DO up migration here

      return done()
    }, configuration.getConfig('masterTenantID'))
  })
};

exports.down = function down(done) {
  helpers.start(function() {
    database.getDatabase(function(err, db) {
      if (err) {
        done(err)
      }

      //DO down migration here

      return done()
    }, configuration.getConfig('masterTenantID'))
  });
};
