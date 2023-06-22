console.log('running updatestructure');

var async = require('async');
var fs = require('fs');
var path = require('path');
var util = require('util');

var configuration = require('./configuration');
var database = require('./database');
var frameworkhelper = require('./frameworkhelper');
var logger = require('./logger');
var permissions = require('./permissions');
var rest = require('./rest');


var UpdateStructure = {

  updateDbStructure: updateDbStructure,

  init: function (app) {
    app.UpdateStructure = this;
    app.on('create:masterdatabase', updateDbStructure);
  }

};

function updateDbStructure (options, next) {
    logger.log('info', 'Running DB structure update scripts')
}

exports = module.exports = UpdateStructure;
