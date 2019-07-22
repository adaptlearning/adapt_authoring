// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');

  var ClipboardModel = require('core/models/clipboardModel');
  var ComponentTypeModel = require('core/models/componentTypeModel');
  var ConfigModel = require('core/models/configModel');
  var CourseAssetModel = require('core/models/courseAssetModel');
  var CourseModel = require('core/models/courseModel');
  var EditorCollection = require('../global/collections/editorCollection');
  var ExtensionTypeModel = require('core/models/extensionTypeModel');
  var MenuTypeModel = require('core/models/menuTypeModel');
  var ThemeTypeModel = require('core/models/themeTypeModel');

  var loadingGlobalData = false;
  var loadingCourseData = false;

  // used to check what's preloaded
  var globalData = {
    componenttypes: false,
    extensiontypes: false,
    menutypes: false,
    themetypes: false
  };
  var globalDataMap = {
    componenttypes: ComponentTypeModel,
    extensiontypes: ExtensionTypeModel,
    menutypes: MenuTypeModel,
    themetypes: ThemeTypeModel
  };
  // used to check what's loaded
  var courseData = {
    course: false,
    config: false
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
      for (var collName in globalData) {
        if (globalData.hasOwnProperty(collName) && !Origin.editor.data[collName]) {
          Origin.editor.data[collName] = createCollection(globalDataMap[collName]);
        }
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
          config: new ConfigModel({ _courseId: courseId })
        });
      }
      // fetch all collections
      fetchEditorData(courseData, function(error) {
        if(_.isFunction(callback)) callback();
        if (error) {
          Origin.trigger('editor:failedToLoad');
        }
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
      var removeEvents = function() {
        Origin.off({
          'editor:dataPreloaded': done,
          'editor:dataLoaded': done,
          'editor:failedToLoad': removeEvents
        });
      };
      var done = function() {
        if(preloader.hasLoadedData()) {
          removeEvents();
          callback.apply(this);
        }
      };
      // in case we've already loaded
      done();

      if(!preloader.hasLoadedGlobalData()) {
        Origin.on('editor:dataPreloaded', done);
      }
      if(!preloader.hasLoadedCourseData()) {
        Origin.on('editor:dataLoaded', done);
      }
      Origin.on('editor:failedToLoad', removeEvents);
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
        error: function(error) {
          onFetchError();
          callback(error);
        }
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
    var siblingTypes = Model.prototype._siblingTypes;
    /**
    * FIXME for non course-specific data without a model._type.
    * Adding siblings will break the below check...
    */
    var inferredType = url.split('/').slice(-1) + 's';
    // FIXME not the best check for course-specific collections
    if(siblingTypes !== undefined) {
      if(!courseId) throw new Error('No Editor.data.course specified, cannot load ' + url);
      url += '?_courseId=' + courseId + (query || '');
    }
    return new EditorCollection(null, {
      autoFetch: false,
      model: Model,
      url: url,
      _type: siblingTypes || inferredType
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
    Origin.router.navigateTo('dashboard');
  }

  /**
  * Export
  */
  return preloader;
});
