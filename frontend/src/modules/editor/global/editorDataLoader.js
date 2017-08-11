// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');

  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ClipboardModel = require('core/models/clipboardModel');
  var ComponentModel = require('core/models/componentModel');
  var ComponentTypeModel = require('core/models/componentTypeModel');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var ConfigModel = require('core/models/configModel');
  var CourseAssetModel = require('core/models/courseAssetModel');
  var CourseModel = require('core/models/courseModel');
  var EditorCollection = require('../global/collections/editorCollection');
  var ExtensionModel = require('core/models/extensionModel');

  var loadingGlobalData = false;
  var loadingCourseData = false;

  // used to check what's preloaded
  var globalData = {
    courses: false,
    extensiontypes: false,
    componenttypes: false
  };
  // used to check what's loaded
  var courseData = {
    clipboards: false,
    course: false,
    config: false,
    contentObjects: false,
    articles: false,
    blocks: false,
    components: false,
    courseassets: false
  };

  // Public API
  var preloader = {
    /**
    * Loads course-specific data
    */
    loadGlobalData: function() {
      if(!Origin.sessionModel.get('isAuthenticated') || loadingGlobalData) {
        return;
      }
      loadingGlobalData = true;
      ensureEditorData();
      resetLoadStatus(globalData);
      // create the global collections
      if(!Origin.editor.data.courses) {
        Origin.editor.data.courses = createCollection(CourseModel);
      }
      if(!Origin.editor.data.extensiontypes) {
        Origin.editor.data.extensiontypes = createCollection(ExtensionModel);
      }
      if(!Origin.editor.data.componenttypes) {
        Origin.editor.data.componenttypes = createCollection(ComponentTypeModel);
      }
      // start preload
      fetchEditorData(globalData, function() {
        loadingGlobalData = false;
        Origin.trigger('editor:dataPreloaded');
      });
    },
    /**
    * Loads course-specific data
    * Accepts callback for editor:refreshData
    */
    loadCourseData: function(callback) {
      if(!Origin.sessionModel.get('isAuthenticated')) {
        // no point continuing if not logged in
        return;
      }
      if(loadingCourseData) {
        return;
      }
      if(!preloader.hasLoadedGlobalData()) {
        return Origin.on('editor:dataPreloaded', function() {
          preloader.loadCourseData(callback);
        });
      }
      loadingCourseData = true;
      resetLoadStatus(courseData);
      var ed = Origin.editor.data;
      var courseId = Origin.location.route1;
      var isAlreadyLoaded = preloader.hasLoadedCourseData() || (ed.course && ed.course.get('_id') === courseId);
      // if data's already been initialised, we can just fetch the latest
      if(!isAlreadyLoaded) {
        _.extend(Origin.editor.data, {
          course: new CourseModel({ _id: courseId }),
          config: new ConfigModel({ _courseId: courseId }),
          contentObjects: createCollection(ContentObjectModel),
          articles: createCollection(ArticleModel),
          blocks: createCollection(BlockModel),
          components: createCollection(ComponentModel),
          clipboards: createCollection(ClipboardModel, '&createdBy=' + Origin.sessionModel.get('id')),
          courseassets: createCollection(CourseAssetModel)
        });
      }
      // fetch all collections
      fetchEditorData(courseData, function() {
        if(_.isFunction(callback)) callback();
        loadingCourseData = false;
        Origin.trigger('editor:dataLoaded');
      });
    },
    /**
    * Deletes course-specific data
    */
    reset: function() {
      Origin.editor.data = _.omit(Origin.editor.data, Object.keys(courseData));
    },
    /**
    * Makes sure all data has been loaded and calls callback
    */
    waitForLoad: function(callback) {
      var done = function() {
        if(preloader.hasLoadedData()) {
          Origin.off('editor:dataPreloaded', done);
          Origin.off('editor:dataLoaded', done);
          callback.apply(this);
        }
      }
      // in case we've already loaded
      done();

      if(!preloader.hasLoadedGlobalData()) {
        Origin.on('editor:dataPreloaded', done);
      }
      if(!preloader.hasLoadedCourseData()) {
        Origin.on('editor:dataLoaded', done);
      }
    },
    /**
    * Uses the below checks to test loading status
    */
    hasLoadedData: function() {
      return preloader.hasLoadedGlobalData() && preloader.hasLoadedCourseData();
    },
    /**
    * Trivial check for editor global data (see globalData above)
    */
    hasLoadedGlobalData: function() {
      return isAllDataLoaded(globalData);
    },
    /**
    * Trivial check for editor course data (see courseData above)
    */
    hasLoadedCourseData: function() {
      return isAllDataLoaded(courseData);
    },
  };

  /**
  * Functions
  */

  function isAllDataLoaded(data) {
    if(!data) return false;
    return _.every(data, function(value, key) { return value; });
  }

  function resetLoadStatus(data) {
    _.each(data, function(value, key) { data[key] = false; });
  }

  /**
  * Makes sure the Origin editor objects exist
  */
  function ensureEditorData() {
    if(!Origin.editor) Origin.editor = {};
    if(!Origin.editor.data) Origin.editor.data = {};
  }

  /**
  * Fetches a group of editor collections (Origin.editor.data)
  * @param object whose keys are the key found on Origin.editor.data
  * and is used for progress checking
  */
  function fetchEditorData(data, callback) {
    for(var i = 0, count = Object.keys(data).length; i < count; i++) {
      var key = Object.keys(data)[i];
      Origin.editor.data[key].fetch({
        success: function(collection) {
          data[collection._type] = true;
          if(callback && isAllDataLoaded(data)) callback.apply(this);
        },
        error: onFetchError
      });
    }
  }

  /**
  * Returns a new EditorCollection from the passed model
  * Deduces URL from the Model's prototype data
  */
  function createCollection(Model, query) {
    var courseId = Origin.location.route1;
    var url = Model.prototype.urlRoot;
    var siblings = Model.prototype._siblings;
    /**
    * FIXME for non course-specific data without a model._type.
    * Adding siblings will break the below check...
    */
    var inferredType = url.split('/').slice(-1) + 's';
    // FIXME not the best check for course-specific collections
    if(siblings !== undefined) {
      if(!courseId) throw new Error('No Editor.data.course specified, cannot load ' + url);
      url += '?_courseId=' + courseId + (query || '');
    }
    return new EditorCollection(null, {
      autoFetch: false,
      model: Model,
      url: url,
      _type: siblings || inferredType
    });
  }

  /**
  * Event handlers
  */

  function onFetchError(model, response, options) {
    Origin.Notify.alert({
      type: 'error',
      text: Origin.l10n.t('app.errorgeneric')
    });
  }

  /**
  * Export
  */
  return preloader;
});
