/**
 * Asset Managment module
 */

var path = require('path'),
    util = require('util'),
    database = require('./database'),
    logger = require('./logger'),
    rest = require('./rest'),
    usermanager = require('./usermanager'),
    filestorage = require('./filestorage'),
    formidable = require('formidable'),
    IncomingForm = formidable.IncomingForm;

/**
 * CONSTANTS
 */

var MODNAME = 'assetmanager',
    WAITFOR = 'contentmanager';

// errors
function AssetNotFoundError (message, assetID) {
  this.name = 'AssetNotFoundError';
  this.message = (message || 'Asset was not found') + (assetID && (' assetID: ' + assetID));
};

util.inherits(AssetNotFoundError, Error);

exports = module.exports = {

  /**
   * preload function sets up event listener for startup events
   *
   * @param {object} app - the AdaptBuilder instance
   * @return {object} preloader - an AdaptBuilder ModulePreloader
   */

  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events:this.preloadHandle(app,this) });
    return preloader;
  },

  /**
   * Event handler for preload events
   *
   * @param {object} app - Server instance
   * @param {object} instance - Instance of this module
   * @return {object} hash map of events and handlers
   */

  preloadHandle : function (app, instance) {
    return {

      preload : function () {
        var preloader = this;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
      },

      moduleLoaded : function (modloaded) {
        var preloader = this;

        // is the module that loaded this modules requirement
        if(modloaded === WAITFOR){
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.LOADING);

          app.assetmanager = instance;
          // set up routes
          rest.put('/asset', instance.putAsset.bind(instance));
          rest.post('/asset/:id', instance.postAsset.bind(instance));
          rest.get('/asset/:id', instance.getAsset.bind(instance));
          rest.delete('/asset/:id', instance.deleteAsset.bind(instance));

          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        }
      }
    };
  },

  /**
   * creates a new asset
   *
   * @param {object} data - the attributes for the asset
   * @param {callback} cb - function (err, asset)
   */

  createAsset: function (data, cb) {
    database.getDatabase(function (error, db) {
      if (error) {
        return cb(error);
      }

      db.create('Asset', data, cb);
    });
  },

  /**
   * retrieves a single asset record
   *
   * @param {object} search - fields to search on
   * @param {callback} cb - function (err, asset)
   */

  retrieveAsset: function (search, cb) {
    database.getDatabase(function (error, db) {
      if (error) {
        return cb(error);
      }

      db.retrieve('Asset', search, function (error, results) {
        if (error) {
          return cb(error);
        }

        if (results && results.length) {
          return cb(null, results[0]);
        }

        return cb(null, false);
      });
    });
  },

  /**
   * updates an asset
   *
   * @param {object} search - fields to search on
   * @param {object} delta - the attributes that need updated
   * @param {callback} cb - function (err)
   */

  updateAsset: function (search, delta, cb) {
    database.getDatabase(function (error, db) {
      if (error) {
        return cb(error);
      }

      db.update('Asset', search, delta, cb);
    });
  },

  /**
   * deletes an asset
   *
   * @param {string} id - deleting requires that the asset be identified by id
   * @param {callback} cb - function (err)
   */

  destroyAsset: function (id, cb) {
    var assetmanager = this;
    database.getDatabase(function (error, db) {
      if (error) {
        return cb(error);
      }

      assetmanager.retrieveAsset({ _id: id }, function (error, assetRec) {
        if (error) {
          return cb(error);
        }

        if (!assetRec) {
          return cb(new AssetNotFoundError(null, id));
        }

        db.destroy('Asset', { _id: id }, function (error) {
          // if db delete succeeds, we need to remove from repository
          filestorage.getStorage(assetRec.repository, function (error, fs) {
            if (error) {
              // argh. we've destroyed the asset record, but we can't touch the file ...
              logger.log('error', 'Failed to retrieve filestorage repository', assetRec.repository);
              return cb(error);
            }

            fs.deleteFile(assetRec.path, cb);
          });
        });
      })
    });
  },

  /**
   * processes an uploaded asset
   *
   * @param {object} res
   * @param {object} req
   * @param {callback} next
   */

  putAsset: function (req, res, next) {
    var form = new IncomingForm();
    var self = this;
    form.parse(req, function (error, fields, files) {
      if (error) {
        return next(error);
      }

      // write the file to some file storage
      filestorage.getStorage(fields.repository, function (error, fs) {
        if (error) {
          return next(error);
        }

        // all asset uploads are stored by date
        var user = usermanager.getCurrentUser();
        var file = files.file;
        var date = new Date();
        var directory = path.join('assets', [date.getFullYear(), ('0' + (date.getMonth()+1)).slice(-2), ('0' + date.getDate()).slice(-2)].join('-'));
        var filepath = path.join(directory, file.name);

        // the repository should move the file to a suitable location
        fs.processFileUpload(file, filepath, function (error, storedFile) {
          if (error) {
            return next(error);
          }

          // create the asset record
          self.createAsset({
              title: fields.title,
              description: fields.description,
              repository: fields.repository,
              path: storedFile.path,
              size: storedFile.size,
              directory: directory,
              isDirectory: false,
              mimeType: storedFile.type,
              createdBy: user._id,
              dateCreated: date
            },
            function (createError, assetRec) {
              if (createError) {
                // if the record creation fails, remove the file that was uploaded
                fs.deleteFile(storedFile.path, function (delErr) {
                  if (delErr) {
                    // record the delete error, but we really want the creation failure error in the callback
                    logger.log('error', 'Failed to delete stored file in assetmanager', storedFile.path);
                  }

                  // return the creation error
                  return next(createError);
                });
              }

              res.statusCode = 200;
              res.json({_id: assetRec._id});
              return res.end();
            }
          );
        });
      });
    });
  },

  /**
   * responder for post requests
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  postAsset: function (req, res, next) {
    var form = new IncomingForm();
    var self = this;
    form.parse(req, function (error, fields, files) {
      if (error) {
        return next(error);
      }

      // first, ensure we can retrieve the original asset
      self.retrieveAsset({ _id: req.params.id }, function (error, assetRec) {
        if (error) {
          return next(error);
        }

        if (!assetRec) {
          res.statusCode = 404;
          return res.end();
        }

        // write the file to some file storage
        // NB. we don't allow the repository to be changed when updating an asset
        filestorage.getStorage(assetRec.repository, function (error, fs) {
          if (error) {
            return next(error);
          }

          // all asset uploads are stored by date
          var file = files.file;
          var date = new Date();
          var filepath = assetRec.path;
          var delta = fields;

          // set modified date
          delta.dateModified = date;

          // don't overwrite the file unless a new one is provided
          if (file) {
            // the repository should move the file to a suitable location
            fs.processFileUpload(file, filepath, function (error, storedFile) {
              if (error) {
                return next(error);
              }

              // update the delta info
              delta.size = storedFile.size;
              delta.mimeType = storedFile.type;

              // update the asset record
              self.updateAsset({ _id: assetRec._id }, delta, function (error, assetRec) {
                if (error) {
                  return next(error);
                }

                res.statusCode = 200;
                res.json({success: true});
                return res.end();
              });
            });
          } else {
            // just update the fields
            self.updateAsset({ _id: assetRec._id }, delta, function (error, assetRec) {
              if (error) {
                return next(error);
              }

              res.statusCode = 200;
              res.json({success: true});
              return res.end();
            });
          }
        });
      });
    });
  },

  /**
   * responder for get requests
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  getAsset: function (req, res, next) {
    this.retrieveAsset({ _id: req.params.id }, function (error, assetRec) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRec) {
        res.statusCode = 404;
        return res.end();
      }

      res.statusCode = 200;
      res.json(assetRec);
      return res.end();
    });
  },

  /**
   * responder for delete requests
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  deleteAsset: function (req, res, next) {
    this.destroyAsset(req.params.id, function (error) {
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      res.json({success: true});
      return res.end();
    });
  }

};
