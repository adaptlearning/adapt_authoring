//add any helper methods that all migrations can use here
var origin = require('./../../lib/application');
var logger = require('./../../lib/logger');

module.exports = {
  start: function(callback) {
    var app = origin();

    //App is already running
    if(app._httpServer){
      return callback()
    }

    // don't show any logger messages in the console
    logger.level('console','error');
    // start the server first
    app.run({ skipVersionCheck: true, skipStartLog: true });
    app.on('serverStarted', function() {
      return callback();
    });
  }

};