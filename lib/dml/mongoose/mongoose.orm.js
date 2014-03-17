//ORM helper file for this db type

var Schema = require('mongoose').Schema,
    mapper = require('jsonschema-mapper'),
    util = require('util'),
    _ = require('underscore'),
    path = require('path'),
    fs = require('fs');

function Importer (opts){
  Importer.super_.call(this);

  opts = ( opts && _.extend(this._defaultOptions,opts)) || this._defaultOptions;

  if(opts.types){
    if('string' === typeof opts.types){
      this._types = require(opts.types);
    }else{
      this._types = opts.ref;
    }
  }
}

util.inherits(Importer, mapper.BaseImporter);

Importer.prototype.importSchema = function (schemaIn, callback) {
  console.log('start import');
  //@todo validate it's a schema coming in
  this._schema = schemaIn;
  this.doImport();
  this.once('complete', function (err, rawModel) {
    callback();
  });
};

Importer.prototype.exportORM = function ( cback ) {
  var importer = this;

  if(importer.exported){
    return cback(importer.exported);
  }

  importer.exported  = _.clone(importer._model.properties);

  cleanType(importer.exported, importer._types);

  cback(importer.exported);
};

/**
 * Recursive function to walk the properties object for .type's
 *
 * @param {object} obj Object to be checked
 */
function cleanType (obj, types) {
  if(obj && types && 'object' === typeof obj){
    Object.keys(obj).forEach(function(prop){
      if('type' === prop){
        if(obj.type && types[obj.type]){
          obj.type = types[obj.type];
        }
      }
      cleanType(obj[prop], types);
    });
  }
}

Importer.prototype._defaultOptions = {
  types:'./mongooseTypes.js'
};


function ImportManager(){
  ImportManager.super_.call(this, {importClass: Importer});
}

util.inherits(ImportManager, mapper.BaseImportManager);

ImportManager.prototype.readFile = function (uri, cback) {
  var local = "http://localhost/";

  if(uri.substr(0,local.length) === local){
    //special case get from fs

    var localPath = uri.substr(local.length);

    localPath = localPath.split('/');

    if(localPath[0] === 'contentSchema'){
      localPath = path.join(__dirname, '..', 'schema', localPath.join(path.sep));
      fs.readFile(localPath, function (err, contents){
        if(err){
          return cback(err);
        }

        return cback(null, contents);
      });
    }else{
      console.log('Localpath needed where to go for : ' + localPath[0]);
    }

  }

};

module.exports = {'Importer':Importer,
                  'ImportManager': ImportManager};