var express = require('express');
var path = require('path');
var fs = require('fs');
var server = module.exports = express();

server.get('/lang/:lang', function (req, res, next) {
    var lang = req.params.lang; // ie 'en' for /lang/en
    var filename = path.join(__dirname, lang) + '.json';
    var file;

    fs.exists(filename, function(exists) {
        file = exists 
            ? require(filename)
            : require(path.join(__dirname, 'en') + '.json');

        return res.json(file);
    });
});
