'use strict';

const database = require('./../../lib/database');
const helpers = require('./../../migrations/helpers/helper');
const configuration = require('./../../lib/configuration');
const mongoose = require('mongoose');
const async = require('async');

exports.up = function up (done) {
  helpers.start(function() {

    database.getDatabase(function(err, db) {
      if (err) return done(err);

      db.retrieve('courseasset', {}, {}, function(error, docs) {
        async.eachSeries(docs, function(doc, callback) {
          doc._courseId = new mongoose.Types.ObjectId(doc._courseId);
          doc._contentTypeId = new mongoose.Types.ObjectId(doc._contentTypeId);
          doc._assetId = new mongoose.Types.ObjectId(doc._assetId);
          doc._contentTypeParentId = new mongoose.Types.ObjectId(doc._contentTypeParentId);

          doc.markModified('_courseId');
          doc.markModified('_contentTypeId');
          doc.markModified('_assetId');
          doc.markModified('_contentTypeParentId');

          doc.save(error => {
            if (error) return callback(error);
            return callback(null);
          });
        }, function(error) {
          return done();
        });
      });

    }, configuration.getConfig('dbName'));
  })
};

exports.down = function down(done) {
  helpers.start(function() {
    database.getDatabase(function(err, db) {
      if (err) return done(err);

      db.retrieve('courseasset', {}, {}, function(error, docs) {
        async.eachSeries(docs, function(doc, callback) {
          doc._courseId = doc._courseId.toString();
          doc._contentTypeId = doc._contentTypeId.toString();
          doc._assetId = doc._assetId.toString();
          doc._contentTypeParentId = doc._contentTypeParentId.toString();

          doc.markModified('_courseId');
          doc.markModified('_contentTypeId');
          doc.markModified('_assetId');
          doc.markModified('_contentTypeParentId');

          doc.save(error => {
            if (error) return callback(error);
            return callback(null);
          });
        }, function(error) {
          return done();
        });
      });

      return done()
    }, configuration.getConfig('dbName'));
  });
};
