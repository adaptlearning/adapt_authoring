// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var path = require('path'),
    rimraf = require('rimraf'),
    fs = require('fs'),
    should = require('should'),
    origin = require('../../../../'),
    app = false;

var helper = {
  fileContent: "0123456789",
  filePath: 'tmpfile' + Math.round(new Date().getTime() / 1000),
  dirPath: 'tmpdir' + Math.round(new Date().getTime() / 1000),
  rootPath: ''
};

before(function (done){
  app = origin();
  done();
});

after(function (done) {
  // unconditionally remove everything in the test data folder and the folder itself
  rimraf(helper.rootPath, done);
});

describe('plugin:filestorage/localfs', function() {
  before (function (done) {
    helper.rootPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'));
    done();
  });

  it ('should implement FileStorage#putFileContents', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.putFileContents(helper.filePath, { flag: 'w' }, helper.fileContent, function (error) {
        should.not.exist(error);

        // brute force check that the file exists
        fs.exists(path.join(helper.rootPath, helper.filePath), function(exists){
          exists.should.be.true;
          done();
        });
      });
    });
  });

  it ('should implement FileStorage#getFileContents', function () {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.getFileContents(helper.filePath, function (error, buffer) {
        should.not.exist(error);
        helper.fileContent.should.equal(buffer.toString());
      });
    });
  });

  it ('should implement FileStorage#getDirectoryListing', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.getDirectoryListing('/', function (error, list) {
        should.not.exist(error);
        list.length.should.equal(1);
        list[0].should.equal(helper.filePath);
        done();
      });
    });
  });

  it ('should implement FileStorage#moveFile', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      var oldFile = helper.filePath;
      var newFile = helper.filePath + '_new';
      localfs.moveFile(oldFile, newFile, function (error) {
        should.not.exist(error);

        // brute force check that the file exists
        fs.exists(path.join(helper.rootPath, newFile), function(exists){
          exists.should.be.true;
          helper.filePath = newFile; // update filePath
          done();
        });
      });
    });
  });

  it ('should implement FileStorage#getFileStats', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.getFileStats(helper.filePath, function (error, stats) {
        should.not.exist(error);
        stats.isFile().should.be.true;
        done();
      });
    });
  });

  it ('should implement FileStorage#deleteFile', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.deleteFile(helper.filePath, function (error) {
        should.not.exist(error);
        // brute force check that the file does not exist
        fs.exists(path.join(helper.rootPath, helper.filePath), function(exists){
          exists.should.be.false;
          done();
        });
      });
    });
  });

  it ('should implement FileStorage#createDirectory', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.createDirectory(helper.dirPath, function (error) {
        should.not.exist(error);
        // brute force check that the directory exists
        fs.exists(path.join(helper.rootPath, helper.dirPath), function(exists){
          exists.should.be.true;
          done();
        });
      });
    });
  });

  it ('should implement FileStorage#removeDirectory', function (done) {
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.removeDirectory(helper.dirPath, function (error) {
        should.not.exist(error);
        // brute force check that the directory does not exist
        fs.exists(path.join(helper.rootPath, helper.dirPath), function(exists){
          exists.should.be.false;
          done();
        });
      });
    });
  });

  it ('should implement FileStorate#createWriteStream', function (done) {
    var app = origin();

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.createWriteStream(helper.filePath, function (stream) {
        stream.write("I am a chunk", done);
      });
    });
  });

  it ('should implement FileStorate#createReadStream', function (done) {
    var app = origin();

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.createReadStream(helper.filePath, function (stream) {
        stream.on('end', done);
        stream.on('readable', function () {
          while (stream.read()) {
            // do nothing
          }
        });
      });
    });
  });
});
