// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');

  var Origin = require('coreJS/app/origin');
  var EditorRouter = require('editorGlobal/editorRouter');
  var EditorCollection = require('editorGlobal/collections/editorCollection');

  var EditorCourseModel = require('editorCourse/models/editorCourseModel');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  var EditorArticleModel = require('editorPage/models/editorArticleModel');
  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');

  var EditorComponentTypeModel = require('editorPage/models/editorComponentTypeModel');
  var ExtensionModel = require('editorExtensions/models/extensionModel');
  var EditorCourseAssetModel = require('editorCourse/models/editorCourseAssetModel');
  var EditorClipboardModel = require('editorGlobal/models/editorClipboardModel');

  // used to check what's loaded
  var loadedDataTemplate = {
    clipboard: false,
    course: false,
    config: false,
    contentObjects: false,
    articles: false,
    blocks: false,
    components: false,
    courseAssets: false
  };
  // copies above before each load
  var loadedData;

  var isPreloaded = false;
  var isLoaded = false;

  var currentLocation;

  // event listeners
  Origin.on('login:changed login:newSession', preload);
  Origin.on('editor:refreshData', onRefreshData);
  Origin.on('router:editor', onRoute);

  /**
  * Functions
  */

  /**
  * loads data that's needed elsewhere
  */
  function preload() {
    Origin.editor.data.courses = createCollection(EditorCourseModel, '/api/content/course', 'courses');
    Origin.editor.data.extensionTypes = createCollection(ExtensionModel, '/api/extensiontype', 'extensionTypes');
    Origin.editor.data.componentTypes = createCollection(EditorComponentTypeModel, '/api/componenttype', 'componentTypes', {
      comparator: function(model) { return model.get('displayName'); }
    });
    // start preload
    loadEditorData({
      courses: false,
      extensionTypes: false,
      componentTypes: false
    }, function() {
      isPreloaded = true;
      Origin.trigger('editor:dataPreloaded');
    });
  }

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
          if(allDataIsLoaded(data) && callback) callback();
        },
        error: onFetchError
      });
    }
  }

  function setupEditorData(id) {
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
    loadEditorData(_.clone(loadedDataTemplate), function() {
      Origin.trigger('editor:dataLoaded');
      if(currentLocation) EditorRouter.route(currentLocation);
    });
  }

  /**
  * Event handleSettingsRoute
  */

  function onRoute(route1, route2, route3, route4) {
    currentLocation = {
      course: route1,
      type: route2,
      id: route3,
      action: route4
    };
    if (!isPreloaded) {
      Origin.once('editor:dataPreloaded', function() {
        onRoute(currentLocation.course, currentLocation.type, currentLocation.id, currentLocation.action);
      });
      return;
    }
    // Check if data has already been loaded for this project
    if (isLoaded && Origin.editor.data.course.get('_id') === route1) {
      return EditorRouter.route(currentLocation);
    }
    setupEditorData(route1);
  }

  function onRefreshData(callback, context) {
    loadEditorData(_.clone(loadedDataTemplate), function() {
      if(callback) callback.call(context);
    });
  }

  function onFetchError(model, response, options) {
    Origin.Notify.alert({
      type: 'error',
      text: window.polyglot.t('app.errorgeneric')
    });
  }

  /**
  * Helper functions
  */

  function createCollection(Model, url, type, data) {
    return new EditorCollection(null, _.extend({
      autoFetch: false,
      model: Model,
      url: url,
      _type: type
    }, data || {}));
  }

  function allDataIsLoaded(data) {
    if(!data) return false;
    return _.every(data, function(item) { return item === true; });
  };
});
