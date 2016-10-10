/**
 * Exposes the log
 * TODO switch this to use the DB rather than a file
 **/
var _ = require('underscore');
var fs = require('fs');
var configuration = require('../../lib/configuration');
var database = require('../../lib/database');
var logger = require('../../lib/logger');
var origin = require('../../lib/application')();
var server = module.exports = require('express')();
var winstonMongo = require('winston-mongodb').MongoDB;

var COLLECTION_NAME = 'logs';
var DB_LOG_LENGTH = 2048; // in DB
var UI_LOG_LENGTH = 250; // in UI

function initialise() {
  logger.add(winstonMongo, {
    db: getDb(),
    collection: COLLECTION_NAME
  });
  trimLogs();
};

function getDb() {
  var dbString = 'mongodb://';

  var user = configuration.getConfig('dbUser');
  var pass = configuration.getConfig('dbPass');
  if(user && pass) {
    dbString += user + ':' + pass + '@';
  }
  dbString += configuration.getConfig('dbHost');
  dbString += ':' + configuration.getConfig('dbPort');
  dbString += "/" + configuration.getConfig('dbName');

  return dbString;
};

// Trims DB logs to DB_LOG_LENGTH, removing oldest first
function trimLogs() {
  database.getDatabase(function(error, db) {
    if(error) return console.log(error);
    db.retrieve('log', {}, { operators: { sort: { timestamp: 1 } } }, function(error, results) {
      if(results.length > DB_LOG_LENGTH) {
        var noToDelete = results.length - DB_LOG_LENGTH;
        var toDelete = results.slice(0, noToDelete);
        async.each(toDelete, function(item, done) {
          db.destroy('log', { _id: item._id }, done);
        });
      }
    });
  }, configuration.getConfig('masterTenantID'));
};

server.get('/log', function (req, res, next) {
  database.getDatabase(function(error, db) {
    if(error) return res.status(500).json(error.toString());
    db.retrieve('log', {}, {
      jsonOnly: true,
      operators: {
        sort: { timestamp: -1 },
        limit: UI_LOG_LENGTH
      }
    }, function(error, results) {
      if(error) return res.status(500).json(error.toString());
      return res.json(results);
    });
  });
});

initialise();
