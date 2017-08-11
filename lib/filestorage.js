// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var logger = require('./logger')
var pluginmanager = require('./pluginmanager');
/*
 * CONSTANTS
 */
var MODNAME = 'filestorage',
    WAITFOR = 'pluginmanager';

/**
 *
 * @constructor
 */
function FileStorage() {
  this.type = 'none';
}

/**
 * Gets the contents of a file as a Buffer
 *
 * @abstract
 * @param {string} filePath - the path to the file
 * @param {function} callback - function of the form function(error, buffer)
 */

FileStorage.prototype.getFileContents = function(filePath, callback) {
  logger.log('warn', 'FileStorage#getFileContents must be implemented by extending object!');
  callback(new Error('FileStorage#getFileContents not implemented'));
};

/**
 * Puts the given contents to a file
 *
 * @abstract
 * @param {string} filePath - the path to the file
 * @param {string} options - see {@link http://nodejs.org/api/fs.html#fs_fs_writefile_filename_data_options_callback |Nodejs fs}
 * @param {Buffer} buffer - the contents to write to the file
 * @param {function} callback - function of the form function(error, written, buffer)
 * see {@link http://nodejs.org/docs/latest/api/fs.html#fs_fs_write_fd_buffer_offset_length_position_callback | Nodejs fs module }
 */

FileStorage.prototype.putFileContents = function(filePath, options, buffer, callback) {
  logger.log('warn', 'FileStorage#putFileContents must be implemented by extending object!');
  callback(new Error('FileStorage#putFileContents not implemented'));
};

/**
 * creates read stream for a file
 * NOTE: the stream passed to the callback should conform to the
 * {@link http://nodejs.org/api/stream.html#stream_class_stream_readable | stream.Readable} class
 *
 * @abstract
 * @param {string} filePath - the path to the file
 * @param {string} [options] - see {@link http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options |Nodejs fs}
 * @param {function} callback - function of the form function(stream)
 */

FileStorage.prototype.createReadStream = function(filePath, options, callback) {
  logger.log('warn', 'FileStorage#createReadStream must be implemented by extending object!');
  callback(new Error('FileStorage#createReadStream not implemented'));
};

/**
 * creates write stream for a file
 * NOTE: the stream passed to the callback should conform to the
 * {@link http://nodejs.org/api/stream.html#stream_class_stream_writable | stream.Writeable} class
 *
 * @abstract
 * @param {string} filePath - the path to the file
 * @param {string} [options] - see {@link http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options |Nodejs fs}
 * @param {function} callback - function of the form function(stream)
 */

FileStorage.prototype.createWriteStream = function(filePath, options, callback) {
  logger.log('warn', 'FileStorage#createReadStream must be implemented by extending object!');
  callback(new Error('FileStorage#createReadStream not implemented'));
};

/**
 * Deletes a file
 *
 * @abstract
 * @param {string} filePath - the path to the file
 * @param {function} callback - function of the form function(error)
 */

FileStorage.prototype.deleteFile = function(filePath, callback) {
  logger.log('warn', 'FileStorage#deleteFile must be implemented by extending object!');
  callback(new Error('FileStorage#deleteFile not implemented'));
};

/**
 * Copies a file from one tenant to another
 * 
 * @abstract
 * @param {object} asset - An instance of an 'asset' object
 * @param {string} sourceTenant - 'name' of the source tenant
 * @param {string} destinationTenant - 'name' of the destination tenant
 * @param {function} callback - function of the form function(error)
 */
FileStorage.prototype.copyAsset = function(asset, sourceTenant, destinationTenant, callback) {
  logger.log('warn', 'FileStorage#copyFile must be implemented by extending object!');
  callback(new Error('FileStorage#copyFile not implemented'));  
};

/**
 * Moves a file from the given path to the new path
 *
 * @abstract
 * @param {string} oldPath - the original location of the file
 * @param {string} newPath - the intended location of the file
 * @param {function} callback - function of the form function(error)
 */

FileStorage.prototype.moveFile = function(oldPath, newPath, callback) {
  logger.log('warn', 'FileStorage#moveFile must be implemented by extending object!');
  callback(new Error('FileStorage#moveFile not implemented'));
};

/**
 * moves an uploaded file
 *
 * @abstract
 *
 * @param {object} file - information about the file that was uploaded
 * @param {object} storageInfo - information about how to store the file
 * @param {object} [options] - optional settings
 * @param {callback} cb
 */

FileStorage.prototype.processFileUpload = function(file, storageInfo, options, cb) {
  logger.log('warn', 'FileStorage#processFileUpload must be implemented by extending object!');
  callback(new Error('FileStorage#processFileUpload not implemented'));
};

/**
 * Creates a directory at the given path
 *
 * @abstract
 * @param {string} filePath - the path to create the directory at
 * @param {function} callback - function of the form function(error)
 */

FileStorage.prototype.createDirectory = function(filePath, callback) {
  logger.log('warn', 'FileStorage#createDirectory must be implemented by extending object!');
  callback(new Error('FileStorage#createDirectory not implemented'));
};

/**
 * Removes a directory at the given path
 *
 * @abstract
 * @param {string} filePath - the path to the directory to be removed
 * @param {function} callback - function of the form function(error)
 */

FileStorage.prototype.removeDirectory = function(filePath, callback) {
  logger.log('warn', 'FileStorage#removeDirectory must be implemented by extending object!');
  callback(new Error('FileStorage#removeDirectory not implemented'));
};

/**
 * Gets a directory listing at filePath
 *
 * @abstract
 * @param {string} filePath - the path to the directory
 * @param {function} callback - function of the form function(error, results)
 */

FileStorage.prototype.getDirectoryListing = function(filePath, callback) {
  logger.log('warn', 'FileStorage#getDirectoryListing must be implemented by extending object!');
  callback(new Error('FileStorage#getDirectoryListing not implemented'));
};

/**
 * Gets information on the file located at filePath, such as timecreated, timemodified etc.
 *
 * @abstract
 * @param {string} filePath - the path to the desired file
 * @param {function} callback - function of the form function(error, result) where 'result' is an object with stats properties
 */

FileStorage.prototype.getFileStats = function(filePath, callback) {
  logger.log('warn', 'FileStorage#getFileStats must be implemented by extending object!');
  callback(new Error('FileStorage#getFileStats not implemented'));
};

/**
 * Returns a filestorage plugin instance of the specified type
 *
 * @api public
 * @param {string} type - the type of the filestorage plugin: eg 'local', 'amazons3'
 */

function getStorage(type, callback) {
  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('filestorage', type, function (error, pluginInfo) {
    if (error) {
      logger.log('warning', 'Failed to retrieve filestorage plugin: ' + type, error);
      callback(error);
    } else {
      // @TODO - should we cache this result? I think best not to; require will cache anyway. Still ...
      try {
        var Storage = require(pluginInfo.fullPath);
        return callback(null, new Storage());
      } catch (ex) {
        return callback(ex);
      }
    }
  });
}

/**
 * preload function sets up event listener for startup events
 *
 * @param {object} app - the Origin instance
 * @return {object} preloader - a ModulePreloader
 */
function preload(app) {
  var preloader = new app.ModulePreloader(app, MODNAME, {events:preloadHandle(app,this)});
  return preloader;
};

/**
 * Event handler for preload events
 *
 * @param {object} app - Server instance
 * @param {object} instance - Instance of this module
 * @return {object} hash map of events and handlers
 */
function preloadHandle(app, instance){

  return {
      preload : function(){
        var preloader = this;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
      },
      moduleLoaded : function(modloaded){
        var preloader = this;

        // is the module that loaded this modules requirement
        if (modloaded === WAITFOR){
          app.filestorage = instance;
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        }
      }
    };
};

/**
 * Module exports
 */
module.exports.getStorage = getStorage;
module.exports.FileStorage = FileStorage;
module.exports.preload = preload;

