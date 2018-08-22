const _ = require('underscore');
const async = require('async');
const fs = require('fs-extra');
const admzip = require('adm-zip');
const path = require('path');

const CONTENT_MAP = {
  course: 'course.json',
  menu: 'contentObjects.json',
  page: 'contentObjects.json',
  article: 'articles.json',
  block: 'blocks.json',
  component: 'components.json'
};
let exportDir;
let tempDir;

function run(exportDirectory = process.argv[2]) {
  if(!exportDirectory) {
    throw new Error('Export directory must be specified!');
  }
  console.log(`\nAttempting to fix exports in ${exportDirectory}\n`);
  exportDir = exportDirectory;
  tempDir = path.join(exportDirectory, '___temp');
  fs.readdir(exportDirectory, (error, contents) => {
    if(error) {
      return exit(error);
    }
    async.each(contents, (item, cb) => {
      if(path.extname(item) !== '.zip') return cb();
      processZip(item, cb);
    }, exit);
  });
}

function processZip(filename, done) {
  const unzipdir = path.join(tempDir, filename.replace(path.extname(filename), ''));
  const newZipName = filename.replace(path.extname(filename), `-UPDATED${path.extname(filename)}`);
  async.series([
    async.apply(unzip, filename, unzipdir),
    async.apply(checkJson, unzipdir),
    async.apply(removeBuildIncludes, unzipdir),
    async.apply(zip, unzipdir, newZipName)
  ], (error) => {
    if(error) return done(error);
    console.log(`- Fixed ${filename}`);
    done();
  });
}

function unzip(filename, unzipdir, cb) {
  new admzip(path.join(exportDir, filename)).extractAllTo(unzipdir);
  cb();
}

function checkJson(unzipdir, cb) {
  const JSON_ROOT = path.join(unzipdir, 'src', 'course', 'en');
  let filesChanged;
  try { // process and fix any content json issues
    filesChanged = fixContent(mergeJsonData(JSON_ROOT));
  } catch(e) {
    return cb(e);
  }
  if(!filesChanged.length) {
    return cb();
  }
  async.eachOf(filesChanged, (contents, file, doneEach) => {
    const filepath = path.join(JSON_ROOT, file);
    fs.writeJSON(filepath, contents, { spaces: 2 }).then(doneEach).catch(doneEach);
  }, cb);
}

function mergeJsonData(jsonRoot) {
  const CONTENT_KEYS = Object.keys(CONTENT_MAP);
  let data = { arr: [], obj: {} };
  for(var i = 0, count = CONTENT_KEYS.length; i < count; i++) {
    const contentType = CONTENT_KEYS[i];
    const jsonFilename = CONTENT_MAP[contentType];
    if(data.obj[jsonFilename]) { // in case we have multiple different content types in one file (e.g. page/menu)
      continue;
    }
    const contentJson = fs.readJsonSync(path.join(jsonRoot, CONTENT_MAP[contentType]));
    data.obj[jsonFilename] = contentJson;
    if(contentType === 'course') data.arr.push(contentJson);
    else data.arr = data.arr.concat(contentJson);
  }
  return data;
}

function fixContent(data) {
  const idIndex = _.indexBy(data.arr, "_id");
  const idGroups = _.groupBy(data.arr, "_id");
  const parentIdGroups = _.groupBy(data.arr, "_parentId");
  let filesChanged = {};
  // check for errors
  for(var i = 0, count = data.arr.length; i < count; i++) {
    const contentJson = data.arr[i];
    const hasMissingParent = contentJson._type !== 'course' && !idIndex[contentJson._parentId];
    const hasNoChildren = contentJson._type !== 'component' && !parentIdGroups[contentJson._id];
    if(!hasMissingParent && !hasNoChildren) { // no problems
      continue;
    }
    const updatedContent = data.obj[CONTENT_MAP[contentJson._type]];
    if(!updatedContent) {
      continue;
    }
    const jsonIndex = _.indexOf(updatedContent, idIndex[contentJson._id]);
    if(jsonIndex === -1) {
      continue;
    }
    updatedContent.splice(jsonIndex, 1);
    filesChanged[CONTENT_MAP[contentJson._type]] = updatedContent;
  }
  return filesChanged;
}

function removeBuildIncludes(unzipdir, cb) {
  const configPath = path.join(unzipdir, 'src', 'course', 'config.json');
  fs.readJson(configPath).then((config) => {
    if(!config.build) {
      return cb();
    }
    delete config.build;
    fs.writeJSON(configPath, config, { spaces: 2 }).then(cb).catch(cb);
  }).catch(cb);
}

function zip(dir, newZipName, cb) {
  var zip = new admzip();
  zip.addLocalFolder(dir);
  zip.writeZip(path.join(exportDir, newZipName));
  cb();
}

function exit(error) {
  fs.remove(tempDir).then(_handleExit).catch(_handleExit);
  function _handleExit() {
    console.log(`\nProcess ${error ? 'failed.' : 'succeeded!'} ${error || ''}\n`);
    process.exit(error ? 1 : 0);
  }
}

module.exports = run();
