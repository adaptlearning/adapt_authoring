var express = require('express');
var path = require('path');
var fs = require('fs');
var server = module.exports = express();

server.get('/lang/:lang', function (req, res, next) {
    var lang = req.params.lang; // ie 'en' for /lang/en
    var filename = path.join(__dirname, lang) + '.json';
    var file;

    if (fs.existsSync(filename)) {
        file = require(filename);
    } else {
        console.log(filename + ' does not exist -- defaulting to "en"');
        file = require(path.join(__dirname, 'en') + '.json');
    }

    res.json(file);
});
