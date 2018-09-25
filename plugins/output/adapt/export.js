/**
* Global vars
* For access by the other funcs
*/

// directories
var FRAMEWORK_ROOT_DIR = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
var COURSE_ROOT_DIR;
var EXPORT_DIR;

var courseId;
// the top-level callback
var next;
// used with _.omit when saving metadata
var blacklistedProps = [
  '__v',
  '_isDeleted',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  '_hasPreview'
];

AdaptOutput.prototype.export = function(pCourseId, request, response, pNext) {
  self = this;
  // store the params
  var currentUser = usermanager.getCurrentUser();
  COURSE_ROOT_DIR = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.AllCourses, currentUser.tenant._id, pCourseId);
  EXPORT_DIR = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Exports, currentUser._id);
  courseId = pCourseId;
  next = pNext;
  // create the EXPORT_DIR if it isn't there
  fs.ensureDir(EXPORT_DIR, function(error) {
    if(error) {
      return next(error);
    }
    async.auto({
      generateLatestBuild: generateLatestBuild,
      copyFrameworkFiles: ['generateLatestBuild', copyFrameworkFiles],
      copyCourseFiles: ['generateLatestBuild', copyCourseFiles]
    }, zipExport);
  });
};

function generateLatestBuild(courseBuilt) {
  self.publish(courseId, Constants.Modes.export, null, null, courseBuilt);
};

/**
* Copy functions
*/

// copies relevant files in adapt_framework
function copyFrameworkFiles(results, filesCopied) {
  self.generateIncludesForCourse(courseId, function(error, includes) {
    if(error) {
      return filesCopied(error);
    }
    // create list of includes
    for(var i = 0, count = includes.length; i < count; i++)
      includes[i] = '\/' + includes[i] + '(\/|$)';

    var includesRE = new RegExp(includes.join('|'));
    var excludesRE = new RegExp(/\.git\b|\.DS_Store|\/node_modules|\/courses\b|\/course\b|\/exports\b/);
    var pluginsRE = new RegExp('\/components\/|\/extensions\/|\/menu\/|\/theme\/');

    fs.copy(FRAMEWORK_ROOT_DIR, EXPORT_DIR, {
      filter: function(filePath) {
        var posixFilePath = filePath.replace(/\\/g, '/');
        var isIncluded = posixFilePath.search(includesRE) > -1;
        var isExcluded = posixFilePath.search(excludesRE) > -1;
        var isPlugin = posixFilePath.search(pluginsRE) > -1;

        // exclude any matches to excludesRE
        if(isExcluded) return false;
        // exclude any plugins not in includes
        else if(isPlugin) return isIncluded;
        // include everything else
        else return true;
      }
    }, filesCopied);
  });
};

// uses the metadata list to include only relevant plugin files
function copyCustomPlugins(results, filesCopied) {
  var src = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.Source);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Plugins);
  _.each(metadata.pluginIncludes, function iterator(plugin) {
    var pluginDir = path.join(src, plugin.folder, plugin.name);
    fs.copy(pluginDir, path.join(dest, plugin.name), function(err) {
      if (err) logger.log('error', err);
    });
  });
  filesCopied();
};

// copies everything in the course folder
function copyCourseFiles(results, filesCopied) {
  var source = path.join(COURSE_ROOT_DIR, Constants.Folders.Build, Constants.Folders.Course);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Source, Constants.Folders.Course);
  fs.ensureDir(dest, function(error) {
    if (error) {
      return filesCopied(error);
    }
    fs.copy(source, dest, filesCopied);
  });
};

// copies used assets directly from the data folder
function copyAssets(results, assetsCopied) {
  var dest = path.join(EXPORT_DIR, Constants.Folders.Assets);
  fs.ensureDir(dest, function(error) {
    if (error) {
      return assetsCopied(error);
    }
    async.each(Object.keys(metadata.assets), function iterator(assetKey, doneIterator) {
      var oldId = metadata.assets[assetKey].oldId;
      origin.assetmanager.retrieveAsset({ _id:oldId }, function(error, results) {
        if(error) {
          return doneIterator(error);
        }
        filestorage.getStorage(results[0].repository, function gotStorage(error, storage) {
          var srcPath = storage.resolvePath(results[0].path);
          var destPath = path.join(dest, assetKey);
          fs.copy(srcPath, destPath, doneIterator);
        });
      });
    }, assetsCopied);
  });
};

/**
* post-processing
*/

function zipExport(error) {
  if(error) {
    return next(error);
  }
  var archive = archiver('zip');
  var output = fs.createWriteStream(EXPORT_DIR +  '.zip');

  output.on('close', cleanUpExport);

  archive.on('warning', function(err) {
    logger.log('warn', err);
  });
  archive.on('error', function(error){
    logger.log('error', error);
    cleanUpExport();
  });
  archive.pipe(output);
  archive.glob('**/*', { cwd: path.join(EXPORT_DIR) });
  archive.finalize();
};

// remove the EXPORT_DIR, if there is one
function cleanUpExport(exportError) {
  fs.remove(EXPORT_DIR, function(removeError) {
    next(exportError || removeError);
  });
};
