/*
  Pass-through route to hide Kue end-points from client requests
*/
var configuration = require('../../lib/configuration');
var needle = require('needle');
var express = require('express');
var server = module.exports = express();

server.get('/poll/:id', function (request, response, next) {
  var id = request.params && request.params.id 
    ? request.params.id
    : 0;

  var pollUrl = configuration.getConfig('buildServerStatusUrl');

  if (pollUrl && id !== 0) {

    needle.get(pollUrl + id, function(error, response) {
      if (!error && response.statusCode == 200) {
        return response.json(JSON.parse(response.body));
      } else {
        response.statusCode = 500;
        return response.end();
      }
    }); 
    
  } else {
    response.statusCode = 404;
    return response.end();
  }
});
