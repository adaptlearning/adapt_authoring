var origin = require('../../lib/application');
var logger = require('../../lib/logger');

/**
* Helper methods for all migrations
*/
module.exports = {
  start: function(callback) {
    var app = origin();
    // App is already running
    if(app._httpServer) return callback(app);
    // don't show any logger messages in the console
    logger.level('console','error');
    // start the server
    app.run({ skipVersionCheck: true, skipStartLog: true });
    // return a reference to the app
    app.on('serverStarted', function () { callback(app); });
  }
};
