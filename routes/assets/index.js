var express = require('express');
var path = require('path');
var fs = require('fs');
var server = module.exports = express();
var assetmanager = require('../../lib/assetmanager');

server.get('/assets/:id', function (req, res, next) {
  var id = req.params.id;
  assetmanager.retrieveAsset({ _id: id }, function (error, assetRecs) {
    var assetRec = assetRecs[0];
    res.sendfile(assetRec.path);
  });
});
