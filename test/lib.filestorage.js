var origin = require('../'),
    path = require('path'),
    filestorage = require('../lib/filestorage');

describe('filestorage', function() {
  var filePath = '';
  var newFilePath = '';

  before(function(){
    // @TODO create a file instance
    var app = origin();
    filePath = path.join(app.configuration.serverRoot, 'tmp', 'tmpFile');
    newFilePath = path.join(app.configuration.serverRoot, 'tmp', 'tmpFileNew');
  });

  it ('should allow me to read a file from disk', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.getFileContents(filePath, function(error, result) {
      if (error) {
        done(error);
      } else {
        // @TODO check file contents are as expected
        done();
      }
    });
  });

  it ('should allow me to write a file to disk', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.putFileContents(filePath, 'w', 'foobar', function(error, result) {
      if (error) {
        done(error);
      } else {
        // @TODO check file contents are as expected
        done();
      }
    });
  });

  it ('should allow me to move a file', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.moveFile(filePath, newFilePath, function(error) {
      if (error) {
        done(error);
      } else {
        done();
      }
    });
  });

  it ('should allow me to create a directory', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.createDirectory(filePath, function(error) {
      if (error) {
        done(error);
      } else {
        done();
      }
    });
  });

  it ('should allow me to recursively remove a directory', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.removeDirectory(filePath, function(error) {
      if (error) {
        done(error);
      } else {
        done();
      }
    });
  });

  it ('should allow me to list the contents of a directory', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.getDirectoryListing(filePath, function(error, results) {
      if (error) {
        done(error);
      } else {
        // @TODO check directory contents are as expected
        done();
      }
    });
  });

  it ('should allow me to stat a file or directory', function(done) {
    done(); return; // @TODO - remove when filesystem plugin is added
    var fs = filestorage.getStorage('filesystem');
    fs.getFileStats(filePath, function(error, result) {
      if (error) {
        done(error);
      } else {
        // @TODO check file contents are as expected
        done();
      }
    });
  });

});
