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
    collection: COLLECTION_NAME,
    cappedMax: DB_LOG_LENGTH
  });
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

server.get('/log', function (req, res, next) {
  database.getDatabase(function(error, db) {
    if(error) return res.status(500).json(error.toString());
    db.retrieve('log', {}, { limit: UI_LOG_LENGTH, jsonOnly: true }, function(error, results) {
      if(error) return res.status(500).json(error.toString());
      return res.json(results);
    });
  });
});

initialise();
