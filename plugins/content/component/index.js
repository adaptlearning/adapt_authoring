/**
 * Component content plugin
 *
 */

var origin = require('../../../'),
    contentmanager = require('../../../lib/contentmanager'),
    rest = require('../../../lib/rest'),
    BowerPlugin = require('../bower'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    rimraf = require('rimraf'),
    async = require('async'),
    fs = require('fs'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    util = require('util'),
    path = require('path');


var bowerConfig = {
  type: 'componenttype',
  keywords: 'adapt-component',
  packageType: 'component',
  options: defaultOptions,
  nameList: [
    "adapt-contrib-text#develop",
    "adapt-contrib-narrative#develop",
    "adapt-contrib-media#develop",
    "adapt-contrib-hotgraphic#develop",
    "adapt-contrib-blank#develop",
    "adapt-contrib-accordion#develop",
    "adapt-contrib-graphic#develop",
    "adapt-contrib-matching#develop",
    "adapt-contrib-textInput#develop",
    "adapt-contrib-mcq#develop",
    "adapt-contrib-gmcq#develop",
    "adapt-contrib-slider#develop"
  ]
};

function Component () {
  this.bowerConfig = bowerConfig;
}

util.inherits(Component, BowerPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Component.prototype.getModelName = function () {
  return 'component';
};

/**
 * returns the plugin type identifier for this plugin
 *
 * @return {string}
 */
Component.prototype.getPluginType = function () {
  return 'componenttype';
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 */
Component.prototype.onDatabaseCreated = function (db) {
  BowerPlugin.prototype.onDatabaseCreated.call(this, db);
  ContentPlugin.prototype.onDatabaseCreated.call(this, db);
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Component.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  var pop = { _componentType: ['displayName'] };
  if (!options.populate) {
    options.populate = pop;
  } else {
    options.populate = _.extend(pop, options.populate);
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  BowerPlugin.prototype.initialize.call(null, bowerConfig);
}


// setup components
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Component;
