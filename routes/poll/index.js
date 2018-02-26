/*
  Pass-through route to hide Kue end-points from client requests
*/
var configuration = require('../../lib/configuration');
var logger = require('../../lib/logger');
var usermanager = require('../../lib/usermanager');
var needle = require('needle');
var express = require('express');
var server = module.exports = express();

server.get('/poll/:id', function (request, response, next) {
  var user = usermanager.getCurrentUser();
  var id = request.params && request.params.id 
    ? request.params.id
    : 0;
  var pollUrl = configuration.getConfig('buildServerStatusUrl');

  if (user && pollUrl && id !== 0) {

    needle.get(pollUrl + id, {rejectUnauthorized: false}, function(error, res, body) {
      if (!error && res.statusCode == 200 && body.data.tenantId == user.tenant._id) {
        return response.json(body);
      } else {
        logger.log('error', error);
        response.statusCode = 500;
        return response.end();
      }
    }); 
    
  } else {
    response.statusCode = 404;
    return response.end();
  }
});
