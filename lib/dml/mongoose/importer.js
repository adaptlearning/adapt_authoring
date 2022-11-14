// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var Schema = require('mongoose').Schema,
  mapper = require('json-schema-mapper'),
  util = require('util'),
  _ = require('underscore'),
  path = require('path'),
  fs = require('fs'),
  database = require('../../database');

function Importer(opts) {
  Importer.super_.call(this);
  this.options = _.extend(
    {
      types: './types',
    },
    opts
  );

  if (this.options.types) {
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
    this.exported = _.clone(this._model.properties);
    cleanType(this.exported, this._types);
  }

  // @todo - we need to check for errors
  next(null, this.exported);
};

Importer.prototype.keywords = mapper.BaseImporter.prototype.keywords.concat([
  'ref',
  'protect',
  'editorOnly',
  'index',
  'items',
  'inputType',
  'isSetting',
  'validators',
  'properties',
  'default',
  'globals',
]);

/**
 * Recursive function to walk the properties object for .type's
 *
 * @param {object} obj Object to be checked
 */
function cleanType(obj, types) {
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
  var localPath = database.resolveSchemaPath(uri);
  if (localPath) {
    fs.readFile(localPath, function (err, contents) {
      if (err) {
        return next(err);
      }

      return next(null, contents);
    });
  }
};

module.exports = {
  Importer: Importer,
  ImportManager: ImportManager,
};
