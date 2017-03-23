// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/app/origin');

  var ArticleModel = require('core/app/models/articleModel');
  var BlockModel = require('core/app/models/blockModel');
  var ClipboardModel = require('core/app/models/clipboardModel');
  var ComponentModel = require('core/app/models/componentModel');
  var ComponentTypeModel = require('core/app/models/componentTypeModel');
  var ContentObjectModel = require('core/app/models/contentObjectModel');
  var ConfigModel = require('core/app/models/configModel');
  var CourseAssetModel = require('core/app/models/courseAssetModel');
  var CourseModel = require('core/app/models/courseModel');
  var EditorCollection = require('../global/collections/editorCollection');
  var ExtensionModel = require('core/app/models/extensionModel');

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
        Origin.editor.data.courses = createCollection(CourseModel, '/api/content/course', 'courses');
      }
      if(!Origin.editor.data.extensionTypes) {
        Origin.editor.data.extensionTypes = createCollection(ExtensionModel, '/api/extensiontype', 'extensionTypes');
      }
      if(!Origin.editor.data.componentTypes) {
        Origin.editor.data.componentTypes = createCollection(ComponentTypeModel, '/api/componenttype', 'componentTypes', {
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
      course: new CourseModel({ _id:id }),
      config: new ConfigModel({ _courseId:id }),
      contentObjects: createCollection(ContentObjectModel, '/api/content/contentobject?_courseId='+id, 'contentObjects'),
      articles: createCollection(ArticleModel, '/api/content/article?_courseId='+id, 'articles'),
      blocks: createCollection(BlockModel, '/api/content/block?_courseId='+id, 'blocks'),
      components: createCollection(ComponentModel, '/api/content/component?_courseId='+id, 'components'),
      clipboard: createCollection(ClipboardModel, '/api/content/clipboard?_courseId=' + id + '&createdBy=' + Origin.sessionModel.get('id'), 'clipboard'),
      courseAssets: createCollection(CourseAssetModel, '/api/content/courseasset?_courseId='+id, 'courseAssets')
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
