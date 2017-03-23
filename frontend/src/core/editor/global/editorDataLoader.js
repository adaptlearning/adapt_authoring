// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/app/origin');

  var EditorArticleModel = require('../article/models/editorArticleModel');
  var EditorBlockModel = require('../block/models/editorBlockModel');
  var EditorClipboardModel = require('../global/models/editorClipboardModel');
  var EditorCollection = require('../global/collections/editorCollection');
  var EditorComponentModel = require('../component/models/editorComponentModel');
  var EditorComponentTypeModel = require('../component/models/editorComponentTypeModel');
  var EditorContentObjectModel = require('../contentObject/models/editorContentObjectModel');
  var EditorConfigModel = require('../config/models/editorConfigModel');
  var EditorCourseAssetModel = require('../course/models/editorCourseAssetModel');
  var EditorCourseModel = require('../course/models/editorCourseModel');
  var ExtensionModel = require('../extensions/models/extensionModel');

  var isPreloaded = false;
  var isLoaded = false;
  // used to check what's preloaded
  var globalData = {
    courses: false,
    extensionTypes: false,
    componentTypes: false
  };
  // used to check what's loaded
  var courseData = {
    clipboard: false,
    course: false,
    config: false,
    contentObjects: false,
    articles: false,
    blocks: false,
    components: false,
    courseAssets: false
  };

  var preloader = {
    /**
    * Loads Origin.editor.data
    */
    preload: function() {
      console.log('EditorData.preload');
      // no point continuing if not logged in
      if(!Origin.sessionModel.get('isAuthenticated')) {
        return;
      }
      // make sure the Origin objects exist
      if(!Origin.editor) Origin.editor = {};
      if(!Origin.editor.data) Origin.editor.data = {};

      if(!Origin.editor.data.courses) {
        Origin.editor.data.courses = createCollection(EditorCourseModel, '/api/content/course', 'courses');
      }
      if(!Origin.editor.data.extensionTypes) {
        Origin.editor.data.extensionTypes = createCollection(ExtensionModel, '/api/extensiontype', 'extensionTypes');
      }
      if(!Origin.editor.data.componentTypes) {
        Origin.editor.data.componentTypes = createCollection(EditorComponentTypeModel, '/api/componenttype', 'componentTypes', {
          comparator: function(model) { return model.get('displayName'); }
        });
      }
      // start preload
      loadEditorData(_.clone(globalData), function() {
        isPreloaded = true;
        console.log('preloaded');
        Origin.trigger('editor:dataPreloaded');
      });
    },
    /**
    * Loads course-specific data
    */
    load: function(callback) {
      // if(!Origin.location.route1)
      console.log('EditorData.load', Origin.location.route1);
      // FIXME this is bad, put here as need to reference callback
      var onDataLoad = function() {
        isLoaded = true;
        Origin.trigger('editor:dataLoaded');
        if(typeof callback === 'function') callback.call(this);
      };
      if(!isLoaded || Origin.editor.data.course.get('_id') !== Origin.location.route1) {
        isLoaded = false;
        console.log('set up');
        setUpEditorData(Origin.location.route1, onDataLoad);
      } else {
        console.log('refresh');
        isLoaded = false;
        loadEditorData(_.clone(courseData), onDataLoad);
      }
    },
    /**
    * Deletes course-specific data, and does a fetch on everything else
    */
    reset: function() {
      console.log('EditorData.reset');
      isPreloaded = false;
      Origin.editor.data = _.omit(Origin.editor.data, Object.keys(courseData));
      preloader.preload();
    },
    /**
    * Makes sure all data has been loaded and calls callback
    */
    waitForLoad: function(callback) {
      console.log('waitForLoad', Origin.location.route1);
      if(!isPreloaded) {
        Origin.once('editor:dataPreloaded', function(){
          if(isLoadComplete()) return callback.apply(this);
        });
      }
      if(!isLoaded) {
        Origin.once('editor:dataLoaded', function(){
          if(isLoadComplete()) return callback.apply(this);
        });
      }
    }
  };

  /**
  * Functions
  */

  /**
  * Fetches a group of editor collections (Origin.editor.data)
  * @param object whose keys are the key found on Origin.editor.data
  * and is used for progress checking
  */
  function loadEditorData(data, callback) {
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

  function setUpEditorData(id, callback) {
    // add the following to editor data
    _.extend(Origin.editor.data, {
      course: new EditorCourseModel({ _id:id }),
      config: new EditorConfigModel({ _courseId:id }),
      contentObjects: createCollection(EditorContentObjectModel, '/api/content/contentobject?_courseId='+id, 'contentObjects'),
      articles: createCollection(EditorArticleModel, '/api/content/article?_courseId='+id, 'articles'),
      blocks: createCollection(EditorBlockModel, '/api/content/block?_courseId='+id, 'blocks'),
      components: createCollection(EditorComponentModel, '/api/content/component?_courseId='+id, 'components'),
      clipboard: createCollection(EditorClipboardModel, '/api/content/clipboard?_courseId=' + id + '&createdBy=' + Origin.sessionModel.get('id'), 'clipboard'),
      courseAssets: createCollection(EditorCourseAssetModel, '/api/content/courseasset?_courseId='+id, 'courseAssets')
    });
    // load all collections
    loadEditorData(_.clone(courseData), function() {
      callback.apply(this);
    });
  }

  function createCollection(Model, url, type, data) {
    return new EditorCollection(null, _.extend({
      autoFetch: false,
      model: Model,
      url: url,
      _type: type
    }, data || {}));
  }

  function isAllDataLoaded(data) {
    if(!data) return false;
    return _.every(data, function(item) { return item === true; });
  }

  function isLoadComplete() {
    return isPreloaded && isLoaded;
  }

  /**
  * Event handlers
  */

  function onFetchError(model, response, options) {
    Origin.Notify.alert({
      type: 'error',
      text: window.polyglot.t('app.errorgeneric')
    });
  }

  /**
  * Export
  */
  return preloader;
});
