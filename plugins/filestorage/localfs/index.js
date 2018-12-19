// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Local LocalFileStorage module
 */
var async = require('async');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs-extra');
var path = require('path');
var probe = require('node-ffprobe');
var util = require('util');

var configuration = require('../../../lib/configuration');
var FileStorage = require('../../../lib/filestorage').FileStorage;
var logger = require('../../../lib/logger');
var usermanager = require('../../../lib/usermanager');

function LocalFileStorage() {
  this.dataRoot = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'));
}

util.inherits(LocalFileStorage, FileStorage);

/**
 * All paths used in local filestorage are relative to the dataRoot
 *
 * @param {string} relativePath
 * @param {boolean} [forceMaster] optionally force path to master tenant
 * @return {string} full path
 */

LocalFileStorage.prototype.resolvePath = function (relativePath, forceMaster) {
  var user = usermanager.getCurrentUser();
  if (user) {
    var tenantName;
    if (!forceMaster) {
      tenantName = user.tenant ? user.tenant.name : configuration.getConfig('masterTenantName');
    } else {
      tenantName = configuration.getConfig('masterTenantName');
    }

    // check that the path isn't already absolute
    var prefix = path.join(this.dataRoot, tenantName);
    if (0 === relativePath.indexOf(prefix)) {
      return relativePath;
    }

    return path.join(prefix, relativePath);
  }

  // check if path is absolute
  if (0 === relativePath.indexOf(this.dataRoot)) {
    return relativePath;
  }

  return path.join(this.dataRoot, relativePath);
};

/**
 * changes a fully qualified path to a relative path, or leaves it untouched
 *
 * @param {string} fullPath
 * @return {string} relative path
 */

LocalFileStorage.prototype.getRelativePath = function (fullPath) {
  var user = usermanager.getCurrentUser();
  if (user) {
    var tenantName = user.tenant ? user.tenant.name : 'master';
    var prefix = path.join(this.dataRoot, tenantName);
    if (0 === fullPath.indexOf(prefix)) {
      return fullPath.substr(prefix.length);
    }
  }

  return fullPath;
};

/**
 * Gets the contents of a file as a Buffer
 *
 * @param {string} filePath - the path to the file
 * @param {function} callback - function of the form function(error, buffer)
 */

LocalFileStorage.prototype.getFileContents = function (filePath, callback) {
  fs.readFile(this.resolvePath(filePath), callback);
};

/**
 * Puts the given contents to a file
 *
 * @param {string} filePath - the path to the file
 * @param {string} options - see {@link http://nodejs.org/api/fs.html#fs_fs_writefile_filename_data_options_callback | Nodejs fs}
 * @param {Buffer} buffer - the contents to write to the file
 * @param {function} callback - function of the form function(error, written, buffer)
 * see {@link http://nodejs.org/docs/latest/api/fs.html#fs_fs_write_fd_buffer_offset_length_position_callback | Nodejs fs module }
 */

LocalFileStorage.prototype.putFileContents = function (filePath, options, buffer, callback) {
  fs.outputFile(this.resolvePath(filePath), buffer, options, callback);
};

/**
 * creates a write stream
 *
 * @param {string} filePath - the path to the file
 * @param {string} [options] - see {@link http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options |Nodejs fs}
 * @param {function} callback - function of the form function(stream)
 */

LocalFileStorage.prototype.createWriteStream = function (filePath, options, callback) {
  if ('function' === typeof options) {
    // only callback was passed
    callback = options;
    options = {};
  }
  callback(fs.createWriteStream(this.resolvePath(filePath), options));
};

/**
 * creates a read stream
 *
 * @param {string} filePath - the path to the file
 * @param {string} [options] - see {@link http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options |Nodejs fs}
 * @param {function} callback - function of the form function(stream)
 */

LocalFileStorage.prototype.createReadStream = function (filePath, options, callback) {
  if ('function' === typeof options) {
    // only callback was passed
    callback = options;
    options = {};
  }

  var forceMaster = (options && options.forceMaster)
    ? true
    : false;

  callback(fs.createReadStream(this.resolvePath(filePath, forceMaster), options));
};

/**
 * Deletes a file
 *
 * @param {string} filePath - the location of the file
 * @param {function} callback - function of the form function(error)
 */

LocalFileStorage.prototype.deleteFile = function (filePath, callback) {
  fs.unlink(this.resolvePath(filePath), callback);
};

/**
 * Moves a file from the given path to the new path
 *
 * @param {string} oldPath - the original location of the file
 * @param {string} newPath - the intended location of the file
 * @param {function} callback - function of the form function(error)
 */

LocalFileStorage.prototype.moveFile = function (oldPath, newPath, callback) {
  oldPath = this.resolvePath(oldPath);
  newPath = this.resolvePath(newPath);
  fs.mkdirs(path.dirname(newPath), function (error) {
    if (error) {
      return callback(error);
    }

    fs.rename(oldPath, newPath, callback);
  });
};

/**
 * processes an uploaded file
 *
 * @param {object} file - information about the file that was uploaded
 * @param {object} newPath - new path for the file
 * @param {object} [options] - optional settings
 * @param {callback} cb - callback to handle the processed file
 */

LocalFileStorage.prototype.processFileUpload = function (file, newPath, options, cb) {
  newPath = this.resolvePath(newPath);
  var relativePath = this.getRelativePath(newPath);
  var self = this;

  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }

  fs.mkdirs(path.dirname(newPath), function (error) {
    if (error) {
      return cb(error);
    }

    // possible move between partitions means fs.rename is not the best choice
    // http://stackoverflow.com/questions/4568689/how-do-i-move-file-a-to-a-different-partition-or-device-in-node-js
    var rs = fs.createReadStream(file.path);
    var ws = fs.createWriteStream(newPath);
    rs.pipe(ws);
    rs.on('error', cb);
    rs.on('end', function () {
      var data = {
        path: relativePath,
        thumbnailPath: false,
        name: file.name,
        mimeType: file.type,
        size: file.size
      };

      // create thumbnail?
      async.series([
        function (nextFunc) {
          if (options.createThumbnail) {
            return self.createThumbnail(newPath, file.type, options.thumbnailOptions, function (err, thumbnailPath) {
              if (thumbnailPath) {
                data.thumbnailPath = thumbnailPath;
              }
              nextFunc();
            });
          }

          return nextFunc();
        },
        function (nextFunc) {
          if (options.createMetadata) {
            return self.inspectFile(newPath, file.type, function (err, withMeta) {
              if (withMeta) {
                data = _.extend(data, withMeta);
              }
              nextFunc();
            });
          }

          return nextFunc();
        },
        function (nextFunc) {
          return cb(null, data);
        }
      ]);
    });
  });
} ;

/**
 * Creates a directory at the given path
 *
 * @param {string} filePath - the path to create the directory at
 * @param {function} callback - function of the form function(error)
 */

LocalFileStorage.prototype.createDirectory = function (filePath, callback) {
  fs.mkdir(this.resolvePath(filePath), callback);
};

/**
 * Removes a directory at the given path
 *
 * @param {string} filePath - the path to the directory to be removed
 * @param {function} callback - function of the form function(error)
 */

LocalFileStorage.prototype.removeDirectory = function (filePath, callback) {
  fs.remove(this.resolvePath(filePath), callback);
};

/**
 * Gets a directory listing at filePath
 *
 * @param {string} filePath - the path to the directory
 * @param {function} callback - function of the form function(error, files)
 */

LocalFileStorage.prototype.getDirectoryListing = function (filePath, callback) {
  fs.readdir(this.resolvePath(filePath), callback);
};

/**
 * Gets information on the file located at filePath, such as timecreated, timemodified etc.
 *
 * @param {string} filePath - the path to the desired file
 * @param {function} callback - function of the form function(error, result) where 'result' is an object with stats properties
 */

LocalFileStorage.prototype.getFileStats = function (filePath, callback) {
  fs.stat(this.resolvePath(filePath), callback);
};

/**
 * Copies an asset from one tenant to another.
 *
 * @param {object} asset - A valid 'asset' record
 * @param {string} sourceTenantName - Source tenant.name
 * @param {string} destinationTenantName - Destination tenant.name
 */
LocalFileStorage.prototype.copyAsset = function(asset, sourceTenantName, destinationTenantName, callback) {
  // Verify the destination folder exists
  var dataRoot = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'));
  var assetFolder = path.join(dataRoot, destinationTenantName, asset.directory);

  fs.mkdirs(assetFolder, function(error) {
    if (error) {
      logger.log('error', 'fs.mkdirs error while copying asset, creating ' + assetFolder);
      return callback(error);
    }

    // Copy the asset
    var sourceFile = path.join(dataRoot, sourceTenantName, asset.path);
    var destinationFile = path.join(dataRoot, destinationTenantName, asset.path);

    fs.copy(sourceFile, destinationFile, {clobber:false}, function(error) {
      if (error) {
        logger.log('error', 'fs.copy error while copying ' + asset.filename);
        logger.log('error', 'error copying ' + sourceFile + ' to ' + destinationFile);
        return callback(error);
      }

      // Copy the thumbnail (if required)
      if (asset.thumbnailPath && asset.thumbnailPath !== 'false' && (asset.assetType == 'image' || asset.assetType == 'video')) {

        var sourceThumbnailFile = path.join(dataRoot, sourceTenantName, asset.thumbnailPath);
        var destinationThumbnailFile = path.join(dataRoot, destinationTenantName, asset.thumbnailPath);

        fs.copy(sourceThumbnailFile, destinationThumbnailFile, function(error) {
          if (error) {
            logger.log('error', 'fs.copy error while copying ' + asset.thumbnailPath);
            logger.log('error', 'error copying (thumbnail) ' + sourceThumbnailFile + ' to ' + destinationThumbnailFile);

            // TODO If thumbnails fail it's not the end of the world -- for now
          }

          return callback(null);
        });
      } else {
        return callback(null);
      }
    });
  });
};

/**
 * Creates a thumbnail for a file
 *
 * @param {string} filePath - the path to the desired file
 * @param {string} fileType - image/video/other
 * @param {object} options - settings for the thumbnail
 * @param {callback} next - function of the form function(error, thumbnailPath)
 */

LocalFileStorage.prototype.createThumbnail = function (filePath, fileType, options, next) {
  // early return if we can't create thumbnails
  if (!configuration.getConfig('useffmpeg')) {
    return next(null, false);
  }
  var fileFormat = fileType.split('/')[1];
  fileType = fileType.split('/')[0];
  // also check fileType is supported
  if(!isThumbnailTypeSupported(fileType)) {
    return next(null, false);
  }
  var self = this;
  var thumbExt = ('image' === fileType) ? path.extname(filePath) : '.gif';
  var imgThumbPath = path.join(path.dirname(filePath), path.basename(filePath)) + '_thumb' + thumbExt;

  var ff = new ffmpeg({ source: filePath }).output(imgThumbPath);

  if ('video' === fileType) {
    // pixel format for gifs (only needed with ffmpeg older versions eg 1.2)
    ff.outputOptions('-pix_fmt rgb24');
    // limit file size to ~300kb
    ff.outputOptions('-fs 300000');
    // start position 1sec in case of black screen
    ff.seekInput('00:00:01');
    // setting speed to ~x20 gives a good overview
    ff.videoFilters('setpts=0.05*PTS');
    // set output framerate
    ff.fps(1.5);
  }
  else if ('gif' === fileFormat) {
    // pixel format for gifs (only needed with ffmpeg older versions eg 1.2)
    ff.outputOptions('-pix_fmt rgb24');
    // only want 1 output image
    ff.frames(1);
  }
  // use size from options
  ff.size(options.width + 'x' + options.height);
  // event handling
  ff.on('error', function(err) {
    logger.log('error', 'Failed to create ' + fileType + ' thumbnail: ' + err.message);
    return next(err, false);
  });
  ff.on('end', function() {
    return next(null, self.getRelativePath(imgThumbPath));
  });

  return ff.run();
};

function isThumbnailTypeSupported(type) {
  switch(type) {
    case 'video':
    case 'image':
      return true;
      break;
    default:
      return false;
  }
}

/**
 * inspects a file using ffprobe and sets metadata
 *
 * @param {string} filePath - full path to file?
 * @param {string} fileType - image | video | audio
 * @param {callback} next
 */

LocalFileStorage.prototype.inspectFile = function (filePath, fileType, next) {
 var data = {
    assetType: null,
    metadata: null
  };

  fileType = fileType.split('/')[0];

  switch (fileType) {
    case 'image':
    case 'video':
    case 'audio':
      data.assetType = fileType;
      break;
    default:
      data.assetType = 'other';
      break;
  }

  // early return if we can't create thumbnails
  if (!configuration.getConfig('useffmpeg')) {
    return next(null, data);
  }

  // Interrogate the uploaded file
  probe(filePath, function (err, probeData) {
    if (probeData) {
      // Store extra metadata depending on the type of file uploaded
      switch (fileType) {
        case 'image':
          data.metadata = {
            width: probeData.streams[0].width,
            height: probeData.streams[0].height
          }
          break;
        case 'video':
          data.metadata = {
            duration: probeData.streams[0].duration,
            width: probeData.streams[0].width,
            height: probeData.streams[0].height
          }
          break;
        case 'audio':
          data.metadata = {
            duration: probeData.streams[0].duration
          }
          break;
      }
    }
    return next(null, data);
  });
};

/**
 * Module exports
 *
 */

exports = module.exports = LocalFileStorage;
