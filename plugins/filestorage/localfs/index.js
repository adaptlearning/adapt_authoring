/**
 * Local LocalFileStorage module
 */

var FileStorage = require('../../../lib/filestorage').FileStorage,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    fs = require('fs'),
    path = require('path');

function LocalFileStorage() {
  this.dataRoot = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'));
}

util.inherits(LocalFileStorage, FileStorage);

/**
 * All paths used in local filestorage are relative to the dataRoot
 *
 * @param {string} relativePath
 * @return {string} full path
 */

LocalFileStorage.prototype.resolvePath = function (relativePath) {
  return path.join(this.dataRoot, relativePath);
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
 * @param {string} options - see {@link http://nodejs.org/api/fs.html#fs_fs_writefile_filename_data_options_callback |Nodejs fs}
 * @param {Buffer} buffer - the contents to write to the file
 * @param {function} callback - function of the form function(error, written, buffer)
 * see {@link http://nodejs.org/docs/latest/api/fs.html#fs_fs_write_fd_buffer_offset_length_position_callback | Nodejs fs module }
 */

LocalFileStorage.prototype.putFileContents = function (filePath, options, buffer, callback) {
  fs.writeFile(this.resolvePath(filePath), buffer, options, callback);
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
  fs.rename(oldPath, newPath, callback);
};

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
  fs.rmdir(this.resolvePath(filePath), callback);
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
 * Module exports
 *
 */

exports = module.exports = LocalFileStorage;
