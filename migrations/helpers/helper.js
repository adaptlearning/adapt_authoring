//add any helper methods that all migrations can use here
const origin = require('../../lib/application');
const logger = require('../../lib/logger');
const fs = require('fs-extra');
const path = require('path');

/**
* Helper methods for all migrations
*/
module.exports = {
  start: function(callback) {
    const app = origin();
    //App is already running
    if(app._httpServer) return callback();
    // don't show any logger messages in the console
    logger.level('console','error');
    // start the server
    app.run({ skipVersionCheck: true, skipStartLog: true });
    // return a reference to the app
    app.on('serverStarted', function () { callback(app); });
  },

  replaceSchema: function(schemaName, destination, callback) {
    fs.readJson(path.join(__dirname, '..', 'schema', schemaName + '.schema'), function(error, data) {
      if (error) return callback(error);
      fs.writeJson(destination, data, {spaces: 2}, function(error) {
        if (error) return callback(error);
        return callback(null);
      });
    });
  }
};
