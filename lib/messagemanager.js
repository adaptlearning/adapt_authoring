// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var async = require('async');
var util = require('util');

var configuration = require('./configuration');
var database = require('./database');

/*
 * CONSTANTS
 */
function DuplicateMessageError (message) {
  this.name = 'DuplicateMessageError';
  this.message = message || 'A message already exist for this name';
}

exports = module.exports = {
  /**
   * gets the currently logged in messages from session
   */
  getMasterMessages: function () {
    try { // parse the session messages to give us a plain object without ObjectIds
      return 'master'
    } catch(e) {
      return false;
    }
  },
  retrieveMessages: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    database.getDatabase(function(err,db) {
      db.retrieve('message', search, options, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length > 0) {
          if (results.length === 1) {
            // we only want to retrieve a single message, so we send an error if we get multiples
            return callback(null, results[0]);
          }

          return callback(new Error('expected a single result but returned ' + results.length + ' results'));
        }

        return callback(null, false);
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * updates a single messages
   *
   * @param {object} search - fields to match: should use 'email' which is unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, messages)
   */
  updateMessages: function (search, update, callback) {
    var self = this;
    // only execute if we have a single matching record
    this.retrieveMessages(search, function (error, result) {
      if (error) {
        return callback(error);
      }
      if (!result) {
        return callback(new Error('No matching messages record found'));
      }
      database.getDatabase(function(err, db) {
          db.retrieve('message', { name: self.getMasterMessages() }, function (error, results) {
            if (error) {
              return callback(error);
            }
            if (results && results.length > 1) {
              return callback(new DuplicateMessageError());
            }
            db.update('message', search, update, callback);
          });
      }, configuration.getConfig('dbName'));
    });
  },

  init: function (app) {
    var self = this;
    var rest = require('./rest');

    rest.get('/messages', function (req, res, next) {
      var masterMessages = self.getMasterMessages();

      if (masterMessages) {
        self.retrieveMessages({ name: masterMessages }, function (err, masterMessages) {
          if (err) {
            res.statusCode = 500;
            return res.json(err);
          }
          var data = masterMessages.toObject();
          return res.json(data);
        });
      } else {
        res.statusCode = 400;
        return res.json(false);
      }
    });

    rest.put('/messages', function (req, res, next) {
      var messages = self.getMasterMessages();
      var delta = req.body;

      if (!delta || 'object' !== typeof delta) {
        return res.status(400).json({success: false, message: 'request body was not a valid object'});
      }

      if (!messages) {
        return res.status(400).json(false);
      }
      
      self.updateMessages({name: messages}, delta, function(err) {
        if (err) {
          return next(err);
        }

        return res.status(200).json({success:true});
      });
    });

  }
};
