/**
 * Asset Managment module
 */

var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    util = require('util'),
    crypto = require('crypto'),
    database = require('./database'),
    logger = require('./logger'),
    rest = require('./rest'),
    usermanager = require('./usermanager'),
    filestorage = require('./filestorage'),
    configuration = require('./configuration'),
    formidable = require('formidable'),
    probe = require('node-ffprobe'),
    IncomingForm = formidable.IncomingForm,
    FFMpeg = require('fluent-ffmpeg');

/**
 * CONSTANTS
 */

var MODNAME = 'assetmanager',
    WAITFOR = 'contentmanager',
    STREAM_BUFFER_SIZE = 64 * 1024,
    THUMBNAIL_WIDTH = '?',
    THUMBNAIL_HEIGHT = '200',
    DEFAULT_THUMBNAIL_IMAGE = 'none';

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
          rest.post('/asset', instance.postAsset.bind(instance));
          rest.put('/asset/:id', instance.putAsset.bind(instance));
          rest.get('/asset', instance.getAssets.bind(instance));
          rest.get('/asset/query', instance.queryAssets.bind(instance));
          rest.get('/asset/:id', instance.getAsset.bind(instance));
          rest.get('/asset/serve/:id', instance.serveAsset.bind(instance));
          rest.get('/asset/thumb/:id', instance.assetThumb.bind(instance));
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

      db.create('asset', data, cb);
    });
  },

  /**
   * retrieves an/multiple asset record(s)
   *
   * @param {object} search - fields to search on
   * @param {object} [options] - optional query param
   * @param {callback} cb - function (err, asset)
   */

  retrieveAsset: function (search, options, cb) {
    // shuffle params
    if ('function' === typeof options) {
      cb = options;
      options = {};
    }

    database.getDatabase(function (error, db) {
      if (error) {
        return cb(error);
      }

      db.retrieve('asset', search, options, function (error, results) {
        if (error) {
          return cb(error);
        }

        // if (results && results.length) {
        //   return cb(null, results);
        // }

        return cb(null, results);
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

      db.update('asset', search, delta, cb);
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

      assetmanager.retrieveAsset({ _id: id }, function (error, assetRecs) {
        if (error) {
          return cb(error);
        }

        if (!assetRecs || assetRecs.length !== 1) {
          return cb(new AssetNotFoundError(null, id));
        }

        var assetRec = assetRecs[0];
        db.destroy('asset', { _id: id }, function (error) {
          // if db delete succeeds, we need to remove from repository
          filestorage.getStorage(assetRec.repository, function (error, storage) {
            if (error) {
              // argh. we've destroyed the asset record, but we can't touch the file ...
              logger.log('error', 'Failed to retrieve filestorage repository', assetRec.repository);
              return cb(error);
            }

            storage.deleteFile(assetRec.path, cb);
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

  postAsset: function (req, res, next) {
    var form = new IncomingForm();
    var self = this;
    form.parse(req, function (error, fields, files) {
      if (error) {
        return next(error);
      }

      var repository = fields.repository || 'localfs';
      // write the file to some file storage
      filestorage.getStorage(repository, function (error, storage) {
        if (error) {
          return next(error);
        }

        // all asset uploads are stored by date
        var user = usermanager.getCurrentUser();
        var file = files.file;
        var date = new Date();

        // using hashes for file locations
        var hash = crypto.createHash('sha1');
        var rs = fs.createReadStream(file.path, {flags: 'r', autoClose: true});


        // feed into hasher
        rs.on('data', function (data) {
          hash.update(data, 'utf8');
        });

        // when finished, get the computed has and use to locate file
        rs.on('close', function () {
          var filehash = hash.digest('hex');
          var directory = path.join('assets', filehash.substr(0,2), filehash.substr(2,2));
          var fileExt = path.extname(file.name);
          var filepath = path.join(directory, filehash) + fileExt;

          // the repository should move the file to a suitable location
          storage.processFileUpload(file, filepath, function (error, storedFile) {
            if (error) {
              return next(error);
            }

            var filePath = storedFile.path;
            var asset = {
              title: fields.title,
              description: fields.description,
              repository: repository,
              path: storedFile.path,
              thumbnailPath: DEFAULT_THUMBNAIL_IMAGE,
              size: storedFile.size,
              directory: directory,
              isDirectory: false,
              mimeType: storedFile.type,
              createdBy: user._id,
              dateCreated: date
            };

            var doCreate = function (asset) {
              // Create the asset record
              self.createAsset(asset,
                function (createError, assetRec) {
                  if (createError) {
                    // if the record creation fails, remove the file that was uploaded
                    storage.deleteFile(storedFile.path, function (delErr) {
                      if (delErr) {
                        // record the delete error, but we really want the creation failure error in the callback
                        logger.log('error', 'Failed to delete stored file in assetmanager', storedFile.path);
                      }

                      // return the creation error
                      return next(createError);
                    });
                    return;
                  }

                  res.statusCode = 200;
                  res.json({_id: assetRec._id});
                  return res.end();
                }
              );
            }

            if (configuration.getConfig('useffmpeg')) {
              // Interrogate the uploaded file
              probe(filePath, function(err, probeData) {

                // Derive assetType and (if available) store extra metadata depending on the type of file uploaded
                switch (storedFile.type.split('/')[0]) {
                  case 'image':
                    asset.assetType = 'image';
                    asset.metadata = probeData ? {width: probeData.streams[0].width, height: probeData.streams[0].height} : null;
                    var imageThumbnailPath = asset.path.substr(0, asset.path.lastIndexOf(fileExt)) + '_thumb' + fileExt ;
                    new FFMpeg({ source: asset.path })
                      .withSize(THUMBNAIL_WIDTH + 'x' + THUMBNAIL_HEIGHT)
                      .keepPixelAspect(true)
                      .on('error', function (err) {
                        // keep default thumbnail, but log error
                        logger.log('error', 'Failed to create image thumbnail: ' + err.message);
                        return doCreate(asset);
                      })
                      .on('end', function () {
                        asset.thumbnailPath = imageThumbnailPath;
                        return doCreate(asset);
                      })
                      .saveToFile(imageThumbnailPath);
                  return; // return is important!

                  case 'video':
                    asset.assetType = 'video';
                    asset.metadata = probeData ? {duration: probeData.streams[0].duration, width: probeData.streams[0].width, height: probeData.streams[0].height} : null;
                    var pathToDir = asset.path.substr(0, asset.path.lastIndexOf('/'));
                    new FFMpeg({ source : asset.path })
                      .withSize(THUMBNAIL_WIDTH + 'x' + THUMBNAIL_HEIGHT)
                      .on('error', function (err) {
                        // keep default thumbnail, but log error
                        logger.log('error', 'Failed to create video thumbnail: ' + err.message);
                        return doCreate(asset);
                      })
                      .on('end', function (filenames) {
                        // hmmm - do we keep the original file name? should we rename?
                        if (filenames && filenames.length) {
                          asset.thumbnailPath = path.join(pathToDir, filenames[0]);
                        }
                        return doCreate(asset);
                      })
                      .takeScreenshots(1, pathToDir);
                  return; // return is important!

                  case 'audio':
                    asset.assetType = 'audio';
                    asset.metadata = probeData ? {duration: probeData.streams[0].duration} : null;
                  break;

                  default:
                    asset.assetType = 'other';
                    asset.metadata = null;
                  break;
                }

                return doCreate(asset);
              });
            } else {
              // If FFMpeg is not being used we can't really know the type of file uploaded
              asset.assetType = 'unknown';
              return doCreate(asset);
            }
          });
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

  putAsset: function (req, res, next) {
    var form = new IncomingForm();
    var self = this;
    form.parse(req, function (error, fields, files) {
      if (error) {
        return next(error);
      }

      // first, ensure we can retrieve the original asset
      self.retrieveAsset({ _id: req.params.id }, function (error, assetRecs) {
        if (error) {
          return next(error);
        }

        if (!assetRecs || assetRecs.length !== 1) {
          res.statusCode = 404;
          return res.end();
        }

        var assetRec = assetRecs[0];
        // write the file to some file storage
        // NB. we don't allow the repository to be changed when updating an asset
        filestorage.getStorage(assetRec.repository, function (error, storage) {
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
            storage.processFileUpload(file, filepath, function (error, storedFile) {
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
   * query asset collections
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  queryAssets: function (req, res, next) {
    var options = _.keys(req.body).length
      ? req.body
      : req.query;
    var search = options.search || {};
    this.retrieveAsset(search, options, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs) {
        res.statusCode = 404;
        return res.end();
      }

      res.statusCode = 200;
      res.json(assetRecs);
      return res.end();
    });
  },

  /**
   * responder for asset collections
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  getAssets: function (req, res, next) {
    var search = req.query;
    var options = req.query.operators || {};
    this.retrieveAsset(search, options, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs) {
        res.statusCode = 404;
        return res.end();
      }

      res.statusCode = 200;
      res.json(assetRecs);
      return res.end();
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
    this.retrieveAsset({ _id: req.params.id }, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs || !assetRecs.length) {
        res.statusCode = 404;
        return res.end();
      }

      res.statusCode = 200;
      res.json(assetRecs[0]);
      return res.end();
    });
  },

  /**
   * serves the file for an asset - one at a time!
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  serveAsset: function (req, res, next) {
    this.retrieveAsset({ _id: req.params.id }, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs || assetRecs.length !== 1) {
        res.statusCode = 404;
        return res.end();
      }

      var assetRec = assetRecs[0];
      filestorage.getStorage(assetRec.repository, function (error, storage) {
        if (error) {
          return next(error);
        }

        storage.createReadStream(assetRec.path, { bufferSize: STREAM_BUFFER_SIZE }, function (stream) {
          res.writeHead(200, {
             'Content-Type': assetRec.mimeType,
             'Content-Length': assetRec.size
           });
          stream.pipe(res);
          stream.on('end', function () {
            return res.end();
          });
        });
      });
    });
  },

  /**
   * serves the thumb for an asset - one at a time!
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  assetThumb: function (req, res, next) {
    this.retrieveAsset({ _id: req.params.id }, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs || assetRecs.length !== 1) {
        res.statusCode = 404;
        return res.end();
      }

      var assetRec = assetRecs[0];
      filestorage.getStorage(assetRec.repository, function (error, storage) {
        if (error) {
          return next(error);
        }

        storage.createReadStream(assetRec.thumbnailPath, { bufferSize: STREAM_BUFFER_SIZE }, function (stream) {
          stream.pipe(res);
          stream.on('end', function () {
            return res.end();
          });
        });
      });
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
