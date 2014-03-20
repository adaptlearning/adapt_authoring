var Schema = require('mongoose').Schema,
    mapper = require('json-schema-mapper'),
    util = require('util'),
    _ = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    configuration = require('../../configuration');

function Importer (opts) {
  Importer.super_.call(this);
  this.options = _.extend({
      types: './types'
    }, opts);

  if (this.options.types){
    if ('string' === typeof this.options.types) {
      this._types = require(this.options.types);
    } else {
      this._types = this.options.ref;
    }
  }
}

util.inherits(Importer, mapper.BaseImporter);

Importer.prototype.importSchema = function (schemaIn, callback) {
  // @todo validate it's a schema coming in
  this._schema = schemaIn;
  this.doImport();
  this.once('complete', callback);
};

Importer.prototype.getSchema = function (next) {
  if (!this.exported) {
    this.exported  = _.clone(this._model.properties);
    cleanType(this.exported, this._types);
  }

  // @todo - we need to check for errors
  next(null, this.exported);
};

Importer.prototype.keywords = mapper.BaseImporter.prototype.keywords.concat('ref');

/**
 * Recursive function to walk the properties object for .type's
 *
 * @param {object} obj Object to be checked
 */
function cleanType (obj, types) {
  if (obj && types && 'object' === typeof obj) {
    Object.keys(obj).forEach(function (prop) {
      if ('type' === prop) {
        if (obj.type && types[obj.type]) {
          obj.type = types[obj.type];
        }
      }
      cleanType(obj[prop], types);
    });
  }
}

function ImportManager() {
  ImportManager.super_.call(this, { importClass: Importer });
}

util.inherits(ImportManager, mapper.BaseImportManager);

ImportManager.prototype.readFile = function (uri, next) {
  var local = "http://localhost/";
  if (uri.substr(0, local.length) === local) {
    // special case get from fs
    var localPath = path.join(configuration.serverRoot, 'lib', 'dml', 'schema', uri.substr(local.length).replace(/\//g, path.sep));
    fs.readFile(localPath, function (err, contents) {
      if (err) {
        return next(err);
      }

      return next(null, contents);
    });
  }
};

module.exports = {
  'Importer': Importer,
  'ImportManager': ImportManager
};
