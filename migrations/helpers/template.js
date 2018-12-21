'use strict';

var helpers = require('../helpers/helper');

exports.up = function up(done) {
  helpers.start(function(app) {
    /**
    * Do UP migration here
    * - reference master DB with app.db
    * - call done on finish
    */
    done();
  });
};

exports.down = function down(done) {
  helpers.start(function(app) {
    /**
    * Do DOWN migration here
    * - reference master DB with app.db
    * - call done on finish
    */
    done();
  });
};
