var helpers = require('../helpers/helper');

function removeSessions(done) {
  helpers.start(function(app) {
    app.db.conn.dropCollection('sessions', done);
  });
}

module.exports = { up: removeSessions, down: removeSessions };
