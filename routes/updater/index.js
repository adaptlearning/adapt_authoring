/**
* Just loads in the other files.
*/

// export needed by router.js
module.exports = require('express')();

var framework = require('./framework');
var server = require('./server');
