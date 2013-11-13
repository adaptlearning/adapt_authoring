var builder = require('./lib/application'),
    logger = require('./lib/logger'),
    winston = require('winston');

var app = builder();
app.start();
