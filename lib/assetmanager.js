// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Asset Managment module
 */

var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async'),
    util = require('util'),
    async = require('async'),
    crypto = require('crypto'),
    database = require('./database'),
    logger = require('./logger'),
    rest = require('./rest'),
    usermanager = require('./usermanager'),
    filestorage = require('./filestorage'),
    configuration = require('./configuration'),
    permissions = require('./permissions'),
    formidable = require('formidable'),
    IncomingForm = formidable.IncomingForm;

/**
 * CONSTANTS
 */

var MODNAME = 'assetmanager',
    WAITFOR = 'contentmanager',
    STREAM_BUFFER_SIZE = 64 * 1024,
    THUMBNAIL_WIDTH = '?',
    THUMBNAIL_HEIGHT = '200',
    DEFAULT_THUMBNAIL_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAGcAAAB5CAMAAAATQ88gAAABL1BMVEU+SWA/SmFBS2JBTGNCTWNETmVET2VFUGZGUWdIU2lJU2pMV21NWG5OWW9RXHJTXnNUX3VWYHZXYndYYnhaZHlbZnpcZ3tdaHxgan5ibIBibYFjboJlcINncoVpcodqdIhrdYlsdopueIxveYxweY1xe45yfZB0fZF2gJN6hJZ6hZZ8hph9h5iBiZuDjJ6FjqCGj6CGkKGHkKKIkqSKk6WLlKWQmaqTnK2Una2Vna6Xn6+YobGZorKcpbSep7efqLihqrqkrLylrr2qssGwuca1vMq6ws+8xdLAyNXBydbFzdrHz9zI0N3K0t/L0t/M1ODN1ODQ2OPS2uXS2+bV3OjW3ejY3+ra4u3c5O/e5fDf5vHg6PPh6fTj6/bk6/bl7Pfm7ffm7vjn7vno7/np8PoQVD/gAAACnklEQVR4Ae3WbVMSURjG8bNUbmaY1EZqkgpYJhlFUWRkQhKgaQ+JmQ/hw/39P0MzNbfT5l4ehGv3Re3/9XXm9+rM3Ebky6sHXqr/vNnF5S2xZaR21QzexMqBxXljOI3Wuuc6Vwyryc55DrGRVjSOcZvYiQgybMji3MhdPAxhpyT20NvswmUAcZ2SbHoAIjvyLQ0grgMgugMgugMgugMgugMgugMgugMgugMgvgMgvgMgvgMgvgMgvgMgugOgFtsB0EiH7QBoskt1MFSjOhgaPaA6GFoJx1HI08FEqI5sXtLFVqiOLOhimeLcKYGyulikOPZmB3ISPTveQM7tnp3UQE4hIqftRONIOSLnR9lhO6BWIZ0YzFmvZMZcdyxTWZf+y9mc9pQ5baodlnNYNL6Kh6E4u9Pmr6Z3Q3COsuZM2SOqg39Fme5sOEGOs8F25kxgc2Rn24C2uU4dOXWuU0BOgevMIGeG66SRk+Y648gZ5zp55OS5ThE5Ra7TQE6D6+wNBTNDexLQx2fHfTn4uCgHMtfNIwBZnZ3hIGZ4J5gxALI7shrkrCIGQXZHKmeZCmYQZHek6vgVp4oZDNkdaST/ZJINwFgguyP7S8lTZWkfMwiyO9rJWvXp/PyT12snghkMYQcGGAAxHMAoxHMAoxDPAYxCPAcwCvEcwCjEciCjEMdBDIB6dJpNzGDowk7TdZt2BkJ2RxljfNAnxADI7iijEGYwhJ0ARiHAgJ7bHT+jEGJAOcEOYBRShusoo5AyRMfHKFRXhuAARqM6gOE7gOE7gOE7t0w0Tip2Yid2Yuffc/jFTuz8H07mbRh5fie8InZuRuTkI3JeROMkPoh5GIHzUsR8vx8687grYkTe3XVDRK7dey/yyxE5/vo5rDryu5+fSKzliGdNYwAAAABJRU5ErkJggg==';

// errors
function AssetNotFoundError (message, assetID) {
  this.name = 'AssetNotFoundError';
  this.message = (message || 'Asset was not found') + (assetID && (' assetID: ' + assetID));
};

util.inherits(AssetNotFoundError, Error);

function AssetPermissionError (message, assetID) {
  this.name = 'AssetPermissionError';
  this.message = (message || 'You are not allowed to do that.') + (assetID && (' assetID: ' + assetID));
};

util.inherits(AssetPermissionError, Error);

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

          // asset manager handles it's own routes
          permissions.ignoreRoute(/^\/api\/asset\/?.*$/);

          app.assetmanager = instance;
          // set up routes
          rest.post('/asset', instance.postAsset.bind(instance));
          rest.put('/asset/restore/:id', instance.restoreAssetByID.bind(instance));
          rest.put('/asset/trash/:id', instance.trashAssetByID.bind(instance));
          rest.put('/asset/:id', instance.putAsset.bind(instance));
          // Commented out as assets are now queried
          /*rest.get('/asset', instance.getAssets.bind(instance));*/
          rest.get('/asset/query', instance.queryAssets.bind(instance));
          rest.get('/asset/:id', instance.getAsset.bind(instance));
          rest.get('/asset/serve/:id', instance.serveAsset.bind(instance));
          rest.get('/asset/thumb/:id', instance.assetThumb.bind(instance));
          rest.get('/shared/asset/:id', instance.serveSharedAsset.bind(instance));
          rest.delete('/asset/:id', instance.deleteAsset.bind(instance));

          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        }
      }
    };
  },

  /**
   * checks if a user is permitted the action on the resource
   *
   * @param {string} action
   * @param {objectid} userId
   * @param {objectid} tenantId
   * @param {object} a content item
   * @param {callback} next (function (err, isAllowed))
   */

  hasPermission: function (action, userId, tenantId, contentItem, next) {
    var resource = permissions.buildResourceString(tenantId, '/api/asset/' + contentItem._id);
    permissions.hasPermission(userId, action, resource, next);
  },

  /**
   * creates a new asset
   *
   * @param {object} data - the attributes for the asset
   * @param {object} [options] 
   * @param {callback} next - function (err, asset)
   */

  createAsset: function (data, options, next) {
    // shuffle params
    if ('function' === typeof options) {
      next = options;
      options = {};
    }
    
    var user = options.user || usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var self = this;

    database.getDatabase(function (error, db) {
      if (error) {
        return next(error);
      }

      // set creation date
      if (!data.createdAt) {
        data.createdAt = new Date();
      }

      db.create('asset', data, function (err, doc) {
        if (err) {
          return next(err);
        }

        permissions.createPolicy(user._id, function (err, policy) {
          if (err) {
            logger.log('error', 'there was an error granting editing permissions', err);
          }

          var resource = permissions.buildResourceString(tenantId, '/api/asset/' + doc._id);
          permissions.addStatement(policy, ['create', 'read', 'update', 'delete'], resource, 'allow', function (err) {
            if (err) {
              logger.log('error', 'there was an error granting editing permissions', err);
            }
            return next(null, doc);
          });
        });
      });

    });
  },

  /**
   * retrieves an/multiple asset record(s)
   *
   * @param {object} search - fields to search on
   * @param {object} [options] - optional query param
   * @param {callback} next - function (err, asset)
   */

  retrieveAsset: function (search, options, next) {

    // shuffle params
    if ('function' === typeof options) {
      next = options;
      options = {};
    }

    // Ensure the tags are populated
    var pop = { tags: '_id title' };
    if (!options.populate) {
      options.populate = pop;
    } else {
      options.populate = _.extend(pop, options.populate);
    }
    
    database.getDatabase(function (error, db) {
      if (error) {
        return next(error);
      }

      db.retrieve('asset', search, options, function (error, records) {
        if (error) {
          return next(error);
        }

        return next(null, records);
      });
    });
  },

  /**
   * updates an asset
   *
   * @param {object} search - fields to search on
   * @param {object} delta - the attributes that need updated
   * @param {callback} next - function (err)
   */

  updateAsset: function (search, delta, next) {
    var user = usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var self = this;

    self.hasPermission('update', user._id, user.tenant._id, search, function (err, isAllowed) {
      if (!isAllowed) {
        return next(new AssetPermissionError());
      }

      database.getDatabase(function (error, db) {
        if (error) {
          return next(error);
        }

        // set update date!
        if (!delta.updatedAt) {
          delta.updatedAt = new Date();
        }

        db.update('asset', search, delta, next);
      });
    });
  },

  /**
   * deletes an asset
   *
   * @param {string} id - deleting requires that the asset be identified by id
   * @param {callback} next - function (err)
   */

  destroyAsset: function (id, next) {
    var user = usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var self = this;

    self.hasPermission('delete', user._id, tenantId, { _id: id}, function (err, isAllowed) {
      if (!isAllowed) {
        return next(new AssetPermissionError());
      }

      database.getDatabase(function (error, db) {
        if (error) {
          return next(error);
        }

        self.retrieveAsset({ _id: id }, function (error, assetRecs) {
          if (error) {
            return next(error);
          }

          if (!assetRecs || assetRecs.length !== 1) {
            return next(new AssetNotFoundError(null, id));
          }

          var assetRec = assetRecs[0];
          db.destroy('asset', { _id: id }, function (error) {
            // if db delete succeeds, we need to remove from repository
            filestorage.getStorage(assetRec.repository, function (error, storage) {
              if (error) {
                // argh. we've destroyed the asset record, but we can't touch the file ...
                logger.log('error', 'Failed to retrieve filestorage repository', assetRec.repository);
                return next(error);
              }

              storage.deleteFile(assetRec.path, next);
            });
          });
        })
      });
    });
  },

  trashAsset: function(id, next) {
    var user = usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var self = this;

    self.hasPermission('delete', user._id, tenantId, { _id: id}, function (err, isAllowed) {
      if (!isAllowed) {
        return next(new AssetPermissionError());
      }

      database.getDatabase(function (error, db) {
        if (error) {
          return next(error);
        }

        self.retrieveAsset({ _id: id }, function (error, assetRecs) {
          if (error) {
            return next(error);
          }

          if (!assetRecs || assetRecs.length !== 1) {
            return next(new AssetNotFoundError(null, id));
          }

          db.update('asset', { _id: id }, {
            _isDeleted: true, 
            deletedAt: new Date(),
            deletedBy: user._id
          }, function (error) {
            if (error) {
              return next(error);
            }
            next();
          });

        })
      });
    });
  },

  restoreAsset: function(id, next) {
    var user = usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var self = this;

    self.hasPermission('delete', user._id, tenantId, { _id: id}, function (err, isAllowed) {
      if (!isAllowed) {
        return next(new AssetPermissionError());
      }

      database.getDatabase(function (error, db) {
        if (error) {
          return next(error);
        }

        self.retrieveAsset({ _id: id }, function (error, assetRecs) {
          if (error) {
            return next(error);
          }

          if (!assetRecs || assetRecs.length !== 1) {
            return next(new AssetNotFoundError(null, id));
          }

          db.update('asset', { _id: id }, {
            _isDeleted: false
          }, function (error) {
            if (error) {
              return next(error);
            }
            next();
          });

        })
      });
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

      // IE 8 and 9 struggle with the application/json response here
      var isLimitedBrowser = (req.headers['accept'] && req.headers['accept'].indexOf('text/html') > -1)
        ? true
        : false;

      var repository = configuration.getConfig('filestorage') || 'localfs';
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
          var uploadedFilePath = file.path;

          var fileOptions = {
            createMetadata: true,
            createThumbnail: true,
            thumbnailOptions: {
              width: THUMBNAIL_WIDTH,
              height: THUMBNAIL_HEIGHT
            }
          };

          // the repository should move the file to a suitable location
          storage.processFileUpload(file, filepath, fileOptions, function (error, storedFile) {
            if (error) {
              return next(error);
            }

            var filePath = storedFile.path;
            
            // It's better not to set thumbnailPath if it's not set.
            if (storedFile.thumbnailPath) {
              storedFile.thumbnailPath = storedFile.thumbnailPath;
            }
            
            var asset = _.extend({
                title: fields.title,
                description: fields.description,
                repository: repository,
                filename: filehash + fileExt,
                directory: directory,
                isDirectory: false,
                tags: (fields.tags && fields.tags.length) ? fields.tags.split(',') : [],
                createdBy: user._id,
                dateCreated: date
              }, 
              storedFile
            );

            // Create the asset record
            self.createAsset(
              asset,
              function (createError, assetRec) {
                if (createError) {
                  logger.log('error', createError);
                  // if the record creation fails, remove the file that was uploaded
                  storage.deleteFile(storedFile.path, function (delErr) {
                    if (delErr) {
                      // record the delete error, but we really want the creation failure error in the callback
                      logger.log('error', 'Failed to delete stored file in assetmanager', storedFile.path);
                    }

                    // Indicate that an error has occurred
                    return res.status(500).json({success: false, message: "An error occured during upload, please contact an Administrator."});
                  });
                  return;
                }

                res.statusCode = 200;

                if (!isLimitedBrowser) {
                  return res.json({ _id: assetRec._id });
                } else {
                  // This primarily for IE < 10
                  res.set('Content-Type', 'text/html');
                  res.send(JSON.stringify({_id: assetRec._id}, null, 2));
                }
              }
            );
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

    //var form = new IncomingForm();
    var self = this;
    var fields = req.body;

    var asset = {
      title: fields.title,
      description: fields.description,
      tags: _.pluck(fields.tags, '_id')
    };

    self.updateAsset({ _id: req.body._id }, asset, function (error, assetRec) {
      
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      return res.json({success: true});

    });

    // Not sure we need all this just yet!
    /*form.parse(req, function (error, fields, files) {
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
          return res.json({ success: false, message: 'asset not found' });
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
                return res.json({success: true});
              });
            });
          } else {
            // just update the fields
            self.updateAsset({ _id: assetRec._id }, delta, function (error, assetRec) {
              if (error) {
                return next(error);
              }

              res.statusCode = 200;
              return res.json({success: true});
            });
          }
        });
      });
    });*/
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
    var self = this;
    var orList = [];
    var andList = [];

    if (search.hasOwnProperty('_isDeleted')) {
      if (search._isDeleted == 'false') {
        search._isDeleted = false;
      } else {
        search._isDeleted = true;
      }
    }
    
    // convert searches to regex
    async.each(
      Object.keys(search),
      function (key, nextKey) {
        var exp = {};
        // convert strings to regex for likey goodness
        if ('string' === typeof search[key]) {
          exp[key] = new RegExp(search[key], 'i');
          orList.push(exp);
        } else {
          exp[key] = search[key];
          andList.push(exp);
        }
        nextKey();
      },
      function () {
        var query = {};
        if (orList.length) {
          query.$or = orList;
        }
        
        if (andList.length) {
          query.$and = andList;
        }
        
        self.retrieveAsset(query, options, function (error, assetRecs) {
          if (error) {
            return next(error);
          }

          // record was not found
          if (!assetRecs) {
            res.statusCode = 404;
            return res.json({ success: false, message: 'assets not found' });
          }

          res.statusCode = 200;
          return res.json(assetRecs);
        });
      }
    );
  },

  /**
   * responder for asset collections
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */
   // Commented out as assets are now queried
  /*getAssets: function (req, res, next) {
    var search = req.query;
    var options = req.query.operators || {};

    var pop = { tags: '_id title' };
    if (!options.populate) {
      options.populate = pop;
    } else {
      options.populate = _.extend(pop, options.populate);
    }

    this.retrieveAsset(search, options, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'asset not found' });
      }

      res.statusCode = 200;
      return res.json(assetRecs);
    });
  },*/

  /**
   * responder for get requests
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

  getAsset: function (req, res, next) {
    var options = req.query.operators || {};
    var pop = { tags: '_id title' };
    if (!options.populate) {
      options.populate = pop;
    } else {
      options.populate = _.extend(pop, options.populate);
    }

    this.retrieveAsset({ _id: req.params.id }, options, function (error, assetRecs) {
      if (error) {
        return next(error);
      }

      // record was not found
      if (!assetRecs || !assetRecs.length) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'asset not found' });
      }

      res.statusCode = 200;
      return res.json(assetRecs[0]);
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
    // Remove any trailing extension (if it's been passed in).
    var assetId = req.params.id.indexOf('.') > -1 
      ? req.params.id.split('.')[0]
      : req.params.id;
    
    this.retrieveAsset({ _id:  assetId}, function (error, assetRecs) {
      if (error) {
        return next(error);
      }
      
      // record was not found
      if (!assetRecs || assetRecs.length !== 1) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'asset not found' });
      }

      var assetRec = assetRecs[0];
      filestorage.getStorage(assetRec.repository, function (error, storage) {
        if (error) {
          return next(error);
        }

        storage.createReadStream(assetRec.path, { bufferSize: STREAM_BUFFER_SIZE }, function (stream) {
          res.writeHead(200, {
            'Content-Type': assetRec.mimeType,
            'Content-Length': assetRec.size,
            'Cache-Control': 'max-age=86400'
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
        return res.json({ success: false, message: 'asset not found' });
      }

      var assetRec = assetRecs[0];

      if (assetRec.thumbnailPath && assetRec.thumbnailPath !== 'false') {
        filestorage.getStorage(assetRec.repository, function (error, storage) {
          if (error) {
            return next(error);
          }
  
          storage.createReadStream(assetRec.thumbnailPath, { bufferSize: STREAM_BUFFER_SIZE }, function (stream) {
            res.setHeader('Cache-Control', 'max-age=86400');
            stream.pipe(res);
            stream.on('end', function () {
              return res.end();
            });
          });
        });  
      } else {
        // TODO -- Refactor and use a disk-based image (#850)
        // Return a generic image when no thumnail exists
        var img = new Buffer(DEFAULT_THUMBNAIL_BASE64, 'base64');

        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': img.length
        });
        
        return res.end(img); 
      }      
    });
  },

  /**
   * serves a shared asset from master tenant
   *
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   */

   serveSharedAsset: function (req, res, next) {
    database.getDatabase(function (error, db) {
      if (error) {
        return next(error);
      }
      var options = req.query.operators || {};

      db.retrieve('asset', { _id: req.params.id }, options, function (error, assetRecs) {
        if (error) {
          return next(error);
        }

        // record was not found
        if (!assetRecs || assetRecs.length !== 1) {
          res.statusCode = 404;
          return res.json({ success: false, message: 'asset not found' });
        }

        var assetRec = assetRecs[0];
        filestorage.getStorage(assetRec.repository, function (error, storage) {
          if (error) {
            return next(error);
          }
 
          storage.createReadStream(assetRec.path, { bufferSize: STREAM_BUFFER_SIZE, forceMaster: true }, function (stream) {
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
  // db will be the master database ...
  }, configuration.getConfig('dbName'));
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
      return res.json({success: true});
    });
  },

  trashAssetByID: function(req, res, next) {
    this.trashAsset(req.params.id, function(error) {
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      return res.json({success: true});
    })
  },

  restoreAssetByID: function (req, res, next) {
    this.restoreAsset(req.params.id, function(error) {
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      return res.json({success: true});
    })
    /*this.destroyAsset(req.params.id, function (error) {
      if (error) {
        return next(error);
      }

      res.statusCode = 200;
      return res.json({success: true});
    });*/
  }

};
