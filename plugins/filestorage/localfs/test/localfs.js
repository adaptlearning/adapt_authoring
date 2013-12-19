var path = require('path'),
    fs = require('fs'),
    should = require('should'),
    builder = require('../../../../');

var helper = {
  fileContent: "0123456789",
  filePath: 'tmpfile' + Math.round(new Date().getTime() / 1000),
  dirPath: 'tmpdir' + Math.round(new Date().getTime() / 1000)
};

after(function () {
  // cleanup - make sure to remove tmp file and dir in case of failure
  var app = builder();
  var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.dirPath);
  if (fs.existsSync(fullPath)) {
    fs.rmdirSync(fullPath);
  }
});

describe('plugin:filestorage/localfs', function() {
  it ('should implement FileStorage#getFileContents', function () {
    // add a file and put contents
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.filePath);
    fs.writeFileSync(fullPath, helper.fileContent);

    // run the test
    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.getFileContents(helper.filePath, function (error, buffer) {
        should.not.exist(error);
        helper.fileContent.should.equal(buffer.toString());

        // remove the file
        fs.unlinkSync(fullPath);
      });
    });
  });

  it ('should implement FileStorage#putFileContents', function (done) {
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.filePath);

    fs.exists(fullPath,function(exists){
      console.log('Checked for file :: ' + fullPath + ' ' + exists);
      exists.should.be.false;
      
      app.filestorage.getStorage('localfs', function (error, localfs) {
        should.not.exist(error);
        localfs.putFileContents(helper.filePath, { flag: 'w' }, helper.fileContent, function (error, written, buffer) {
          should.not.exist(error);
  
          // remove the file
          fs.unlinkSync(fullPath);
          done();
        });
      });
    });
  });

  it ('should implement FileStorage#deleteFile', function (done) {
    // add a file and put contents
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.filePath);
    fs.writeFileSync(fullPath, helper.fileContent);

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.deleteFile(helper.filePath, function (error) {
        should.not.exist(error);
        fs.existsSync(fullPath).should.be.false;
        done();
      });
    });
  });

  it ('should implement FileStorage#moveFile', function (done) {
    // add a file and put contents
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.filePath);
    fs.writeFileSync(fullPath, helper.fileContent);

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      var oldFile = helper.filePath;
      var newFile = helper.filePath + '_new';
      localfs.moveFile(oldFile, newFile, function (error) {
        should.not.exist(error);
        fullPath += '_new';
        fs.existsSync(fullPath).should.be.true;

        // cleanup
        fs.unlinkSync(fullPath);
        done();
      });
    });

  });

  it ('should implement FileStorage#createDirectory', function (done) {
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.dirPath);

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.createDirectory(helper.dirPath, function (error) {
        should.not.exist(error);
        fs.existsSync(fullPath).should.be.true;

        // verify the file is a directory
        var stats = fs.statSync(fullPath);
        stats.isDirectory().should.be.true;

        // cleanup
        fs.rmdirSync(fullPath);
        done();
      });
    });

  });

  it ('should implement FileStorage#removeDirectory', function (done) {
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.dirPath);
    fs.mkdirSync(fullPath);

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.removeDirectory(helper.dirPath, function (error) {
        should.not.exist(error);
        fs.existsSync(fullPath).should.be.false;
        done();
      });
    });
  });

  it ('should implement FileStorage#getDirectoryListing', function (done) {
    var app = builder();
    var fullDirPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.dirPath);
    var fullFilePath = path.join(fullDirPath, helper.filePath);

    // create directory and pop our file into it
    fs.mkdirSync(fullDirPath);
    fs.writeFileSync(fullFilePath, helper.fileContent);

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.getDirectoryListing(helper.dirPath, function (error, list) {
        should.not.exist(error);
        list.length.should.equal(1);
        list[0].should.equal(helper.filePath);

        // cleanup
        fs.unlinkSync(fullFilePath);
        fs.rmdirSync(fullDirPath);
        done();
      });
    });

  });

  it ('should implement FileStorage#getFileStats', function (done) {
    var app = builder();
    var fullPath = path.join(app.configuration.serverRoot, app.configuration.getConfig('dataRoot'), helper.filePath);
    fs.writeFileSync(fullPath);

    app.filestorage.getStorage('localfs', function (error, localfs) {
      should.not.exist(error);
      localfs.getFileStats(helper.filePath, function (error, stats) {
        should.not.exist(error);
        stats.isFile().should.be.true;

        // cleanup
        fs.unlinkSync(fullPath);
        done();
      });
    });
  });
});
