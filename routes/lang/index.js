var express = require('express');
var path = require('path');
var server = module.exports = express();

server.get('/lang/:lang', function (req, res, next) {
    var lang = req.params.lang; // ie 'en' for /lang/en
    var pack = require(path.join(__dirname, lang));
    var s = path.join(__dirname, lang + '.json');

    res.json(pack);
});
