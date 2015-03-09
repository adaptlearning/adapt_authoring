var amdOptimize = require("gulp-amd-optimize"),
    async = require("async"),
    chalk = require("chalk"),
    changed = require("gulp-changed"),
    concat = require("gulp-concat"),
    declare = require("gulp-declare"),
    flatten = require("gulp-flatten"),
    fs = require("fs"),
    gulp = require("gulp"),
    gulpif = require("gulp-if"),
    handlebars = require("gulp-handlebars"),
    less = require("gulp-less"),
    jshint = require("gulp-jshint"),
    minifyCSS = require("gulp-minify-css"),
    open = require("gulp-open"),
    Q = require("q"),
    stylish = require("jshint-stylish"),
    uglify = require("gulp-uglify"),
    wrap = require("gulp-wrap");

// TODO: watch
// TODO: casperjs
// TODO: mochaTest
// TODO: pull file and path names into config?

// store the config
var config = {};
try { config = require("./conf/config.json"); }
catch(e) {} // file doesn't exist, no need for handling

function handleError(err, deferred) {
  console.log("[" + chalk.red(err.name) + "] " + err.message);
  if(deferred) deferred.reject(err);
}

function copyFiles(options) {
  var deferred = Q.defer();

  gulp.src(options.files, { cwd: options.cwd, base: options.base })
    .pipe(changed(options.dest))
    .pipe(gulpif(options.flatten, flatten()))
    .pipe(gulp.dest(options.dest))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function copyAssets() {
  var deferred = Q.defer();

  Q.all([
    copyFiles({
      cwd: "frontend/src/core/libraries/tinymce/",
      base: "frontend/src/core/libraries/tinymce/",
      files: ["plugins/**/*", "skins/**/*", "themes/**/*"],
      dest: "frontend/src/adaptbuilder/js/"
    }),
    copyFiles({
      files: ["frontend/src/core/**/assets/**/*"],
      dest: "frontend/src/adaptbuilder/css/assets/",
      flatten: true
    })
  ])
  .then(deferred.resolve);

  return deferred.promise;
}

function requirePlugins() {
  var deferred = Q.defer();

  var root = "frontend/src/plugins/";
  var folderPrefix = "plugins/";
  var pluginMain = "/index";

  return Q.fcall(function() {
    var deferred = Q.defer()
    fs.readdir(root, function(err, files) {
      if (err) deferred.reject(err);
      else deferred.resolve(files);
    });
    return deferred.promise;
  })
  .then(function(files) {
    var deferred = Q.defer();
    var dirs = [];
    async.each(files, function(file, done) {
      fs.stat(root + file, function(err, stats) {
        if(!err && stats.isDirectory()) dirs.push(folderPrefix + file + pluginMain);
        done(err);
      });
    }, function() {
      deferred.resolve(dirs);
    });
    return deferred.promise;
  })
  .then(function(dirs) {
    fs.writeFile(root + "plugins.js", "require(['" + dirs.join("','") +"']);", function(err) {
      if(err) deferred.reject(err);
      else deferred.resolve();
    });
  });

  return deferred.promise;
}

function requireJs(isProduction) {
  var deferred = Q.defer();

  // TODO: sourcemaps

  gulp.src("frontend/src/**/*.js")
    .pipe(amdOptimize("core/app/app", {
      configFile: "frontend/src/core/app/config.js",
      include: ["core/app/config"],

    }))
    .on("error", function(err) { handleError(err, deferred); })
    .pipe(concat("origin.js"))
    .pipe(gulpif(isProduction, uglify({ preserveComments: "some" })))
    .pipe(gulp.dest("frontend/src/adaptbuilder/js/"))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function compileLESS(isProduction) {
  var deferred = Q.defer();

  gulp.src([
    "frontend/src/core/**/*.less",
    "frontend/src/less/**/*.less",
    "frontend/src/plugins/**/*.less"
  ])
    .pipe(less())
    .pipe(concat("adapt.css"))
    .on("error", function(err) { handleError(err, deferred); })
    .pipe(gulpif(isProduction, minifyCSS()))
    .pipe(gulp.dest('frontend/src/adaptbuilder/css/'))
    .on("end", deferred.resolve);

  return deferred.promise;
};

function compileTemplates(isProduction) {
  var deferred = Q.defer();

  gulp.src([
    "frontend/src/core/**/*.hbs",
    "!frontend/src/core/**/partials/*.hbs",
    "frontend/src/plugins/**/*.hbs",
    "!frontend/src/plugins/**/partials/*.hbs"
  ])
    .pipe(handlebars({ base: "frontend/src", cwd: "frontend/src" }))
    .on("error", function(err) { handleError(err, deferred); })
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'Handlebars.templates',
      noRedeclare: true
    }))
    .pipe(concat("templates.js"))
    .pipe(wrap('define("templates",["require","handlebars"], function(require, Handlebars){ this.Handlebars = Handlebars; <%= contents %>})'))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulp.dest("frontend/src/templates/"))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function compilePartials(isProduction) {
  var deferred = Q.defer();

  var registerPartialJS = "for(var key in Handlebars.partial) { Handlebars.registerPartial(key,Handlebars.partial[key]); }";

  gulp.src([
    "frontend/src/core/**/partials/*.hbs",
    "frontend/src/plugins/**/partials/*.hbs"
  ])
    .pipe(handlebars({ base: "frontend/src", cwd: "frontend/src" }))
    .on("error", function(err) { handleError(err, deferred); })
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'Handlebars.partial',
      noRedeclare: true
    }))
    .pipe(concat("partials.js"))
    .pipe(wrap("define('partials',['require','handlebars'], function(require, Handlebars) { this.Handlebars = Handlebars; <%= contents %> " + registerPartialJS + " })"))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulp.dest("frontend/src/templates/"))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function hint(src) {
  gulp.src(src)
    .pipe(jshint({
      "freeze": true,
      "asi": true,
      "eqnull": true,
      "sub": true,
      "expr": true,
      "boss": true,
      "laxbreak": true,
      "predef": ["define","require","console","_","Backbone","Handlebars","tinymce","CKEDITOR"]
    }))
    .pipe(jshint.reporter(stylish));
}

function build(isProduction) {
  var deferred = Q.defer();

  Q.all([
    requirePlugins(),
    copyAssets(),
    compileLESS(isProduction),
    compileTemplates(isProduction),
    compilePartials(isProduction),
  ])
  .then(function() {
    return requireJs(isProduction);
  })
  .then(deferred.resolve);

  return deferred.promise;
}

function runApp() {
  startBuilder();
  openBrowser();
}

function startBuilder() {
  require('./lib/application')().run();
}

function openBrowser(options) {
  var deferred = Q.defer();

  gulp.src("./README.md") // needs an arbitrary file
    .pipe(open("", { url: "http://" + getServerName() + ":" + getServerPort() + "/"}))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function getServerName() {
  return (config.serverName) ? config.serverName : "localhost";
}

function getServerPort() {
  return (config.serverPort) ? config.serverPort : 5000;
}

/**
* gulp tasks
*/

// quick build (NO minification), followed by a run
gulp.task("dev", function() {
  return build(false)
  .then(runApp);
});

// builds for production (with minification)
gulp.task("build", function() {
  return build(true);
});

// just runs app
gulp.task("server", function() {
  return runApp();
});

// just runs app
gulp.task("hint", function() {
  var params = process.argv.slice(3);

  if(params[0] == "--component") {
    var src = false;
    switch(params[1]) {
      case "core":
        src = ["frontend/src/core/**/*.js", "!frontend/src/core/libraries/**"];
        break;
      case "plugins":
        src = "frontend/src/plugins/**/*.js";
        break;
      default:
        return handleError(new Error("invalid component passed '" + params[1] + "'"));
    }
    return hint(src);
  }
  else {
    handleError(new Error("invalid flag passed '" + params[0] + "'"));
    process.exit(-1);
  }
});
