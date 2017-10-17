var fs = require('fs');
var path = require('path');
var should = require('should');

var filestorage = require('../lib/filestorage');
var configuration = require('../lib/configuration');

var testData = require('./testData.json').filestorage;

var localfs;

before(function(done) {
  filestorage.getStorage('localfs', function(error, storage) {
    if(error) return done(error);
    localfs = storage;
    done();
  });
});

it('should be able to write a file to disk', function(done) {
  localfs.putFileContents(testData.filename, {}, testData.fileContents, function(error) {
    should.not.exist(error);
    fs.readFile(localfs.resolvePath(testData.filename), function(error, fsContents) {
      should.not.exist(error);
      fsContents.toString().should.equal(testData.fileContents, 'Unexpected file contents');
      done();
    });
  });
});

it('should be able to read a file from disk', function(done) {
  localfs.getFileContents(testData.filename, function(error, contents) {
    should.not.exist(error);
    contents.toString().should.equal(testData.fileContents, 'Unexpected file contents');
    done();
  });
});

it('should be able to generate stats for file or directory', function(done) {
  localfs.getFileStats(testData.filename, function(error, stats) {
    should.not.exist(error);
    fs.stat(localfs.resolvePath(testData.filename), function(error, fsStats) {
      should.not.exist(error);
      stats.should.eql(fsStats);
      done();
    });
  });
});

it('should be able to create a new directory', function(done) {
  localfs.createDirectory(testData.dirname, function(error) {
    should.not.exist(error);
    fs.stat(localfs.resolvePath(testData.dirname), function(error, stats) {
      should.not.exist(error);
      done();
    });
  });
});

it('should be able to move a file', function(done) {
  localfs.moveFile(testData.filename, path.join(testData.dirname, testData.filename), function(error) {
    should.not.exist(error);
    fs.readFile(localfs.resolvePath(path.join(testData.dirname, testData.filename)), function(error, fsContents) {
      should.not.exist(error);
      fsContents.toString().should.equal(testData.fileContents, 'Unexpected file contents');
      done();
    });
  });
});

it('should be able to list the contents of a directory', function(done) {
  localfs.getDirectoryListing(testData.dirname, function(error, contents) {
    should.not.exist(error);
    fs.readdir(localfs.resolvePath(testData.dirname), function(error, fsContents) {
      should.not.exist(error);
      contents.should.eql(fsContents);
      done();
    });
  });
});

it('should be able to remove a directory recursively', function(done) {
  localfs.removeDirectory(testData.dirname, function(error) {
    should.not.exist(error);
    fs.stat(localfs.resolvePath(testData.dirname), function(error, fsStats) {
      should.exist(error);
      done();
    });
  });
});
