// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');

  var EditorArticleModel = require('./article/models/editorArticleModel');
  var EditorBlockModel = require('./block/models/editorBlockModel');
  var EditorClipboardModel = require('./global/models/editorClipboardModel');
  var EditorCollection = require('./global/collections/editorCollection');
  var EditorComponentModel = require('./component/models/editorComponentModel');
  var EditorComponentTypeModel = require('./component/models/editorComponentTypeModel');
  var EditorContentObjectModel = require('./contentObject/models/editorContentObjectModel');
  var EditorConfigModel = require('./config/models/editorConfigModel');
  var EditorCourseAssetModel = require('./course/models/editorCourseAssetModel');
  var EditorCourseModel = require('./course/models/editorCourseModel');
  var ExtensionModel = require('./extensions/models/extensionModel');

  // load in the submodules
  require([
    './article/index',
    './block/index',
    './component/index',
    './config/index',
    './contentObject/index',
    './course/index',
    './extensions/index',
    './menuSettings/index',
    './theme/index'
  ]);

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

  var isPreloaded = false;
  var isLoaded = false;

  var currentLocation;

  // event listeners
  Origin.on('login:changed login:newSession', preload);
  Origin.on('editor:refreshData', onRefreshData);
  Origin.on('editor:resetData', onResetData);
  Origin.on('router:editor', onRoute);

  /**
  * Functions
  */

  /**
  * loads data that's needed elsewhere
  */
  function preload() {
    // no point continuing if not logged in
    if(!Origin.sessionModel.get('isAuthenticated')) {
      return;
    }
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
      Origin.trigger('editor:dataPreloaded:');
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
    loadEditorData(_.clone(courseData), function() {
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
    loadEditorData(_.clone(courseData), function() {
      if(callback) callback.call(context);
    });
  }

  // deletes course-specific data, and does a fetch on everything else
  function onResetData() {
    Origin.editor.data = _.omit(Origin.editor.data, Object.keys(courseData));
    preload();
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
