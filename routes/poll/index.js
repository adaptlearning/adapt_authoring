/*
  Pass-through route to hide Kue end-points from client requests
*/
var configuration = require('../../lib/configuration');
var http = require('http');
var express = require('express');
var server = module.exports = express();

server.get('/poll/:id', function (request, response, next) {
  var id = request.params && request.params.id 
    ? request.params.id
    : 0;

  var pollUrl = configuration.getConfig('buildServerStatusUrl');

  if (pollUrl && id !== 0) {

    var req = http.get(pollUrl + id, function(res) {
      // Buffer the body entirely for processing as a whole.
      var bodyChunks = [];
      res.on('data', function(chunk) {
        // Process the streamed parts
        bodyChunks.push(chunk);
      }).on('end', function() {
        var body = Buffer.concat(bodyChunks);

        return response.json(JSON.parse(body));
      });
    });    
  } else {
    response.statusCode = 404;
    return response.end();
  }
});
