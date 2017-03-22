// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var dataIsLoaded = false;

  Origin.on('editor:refreshData', function(callback, context) {
    dataIsLoaded = false;
    var loadedData = {
      clipboard: false,
      course: false,
      config: false,
      componentTypes: false,
      extensionTypes: false,
      contentObjects: false,
      articles: false,
      blocks: false,
      components: false,
      courseAssets: false
    };
    Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedObject) {

      loadedData[loadedObject] = true;

      var allDataIsLoaded = _.every(loadedData, function(item) {
        return item === true;
      });

      if (allDataIsLoaded) {

        Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
        Origin.trigger('editor:dataLoaded');
        dataIsLoaded = true;
        if (callback) {
            callback.apply(context);
        }
      }

    });

    // // Not implemented for the time being
    // Origin.editor.data.config.on('change:_enabledExtensions', function() {
    //   Origin.socket.emit('project:build', { id: this.currentCourseId });
    // });

    _.each(Origin.editor.data, function(object) {
      object.fetch({reset:true,
        error: function(model, response, options) {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorgeneric')
          });
        }
      });
    });

  });

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    // Check if data has already been loaded for this project
    if (dataIsLoaded && Origin.editor.data.course && Origin.editor.data.course.get('_id') === route1) {
      return routeAfterDataIsLoaded(route1, route2, route3, route4);
    }

    var loadedData = {
      clipboard: false,
      course: false,
      config: false,
      componentTypes: false,
      extensionTypes: false,
      contentObjects: false,
      articles: false,
      blocks: false,
      components: false,
      courseAssets: false
    };

    Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedObject) {

      loadedData[loadedObject] = true;

      var allDataIsLoaded = _.every(loadedData, function(item) {
        return item === true;
      });

      if (allDataIsLoaded) {

        Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
        Origin.trigger('editor:dataLoaded');
        dataIsLoaded = true;
        routeAfterDataIsLoaded(route1, route2, route3, route4);

      }

    });

    setupEditorData(route1, route2, route3, route4);

  });

  function setupEditorData(route1, route2, route3, route4) {
    Origin.editor.data.course = new EditorCourseModel({_id: route1});
    Origin.editor.data.config = new EditorConfigModel({_courseId: route1});

    Origin.editor.data.contentObjects = new EditorCollection(null, {
      model: EditorContentObjectModel,
      url: '/api/content/contentobject?_courseId=' + route1,
      _type: 'contentObjects'
    });

    Origin.editor.data.articles = new EditorCollection(null, {
      model: EditorArticleModel,
      url: '/api/content/article?_courseId=' + route1,
      _type: 'articles'
    });

    Origin.editor.data.blocks = new EditorCollection(null, {
      model: EditorBlockModel,
      url: '/api/content/block?_courseId=' + route1,
      _type: 'blocks'
    });

    Origin.editor.data.components = new EditorCollection(null, {
      model: EditorComponentModel,
      url: '/api/content/component?_courseId=' + route1,
      _type: 'components'
    });

    Origin.editor.data.clipboard = new EditorCollection(null, {
      model: EditorClipboardModel,
      url: '/api/content/clipboard?_courseId=' + route1 + '&createdBy=' + Origin.sessionModel.get('id'),
      _type: 'clipboard'
    });

    // Store the component types
    Origin.editor.data.componentTypes = new EditorCollection(null, {
      model : EditorComponentTypeModel,
      url: '/api/componenttype',
      _type: 'componentTypes'
    });

    Origin.editor.data.componentTypes.comparator = function(model) {
      return model.get('displayName');
    };

    // Store the extensions types
    Origin.editor.data.extensionTypes = new EditorCollection(null, {
      model : ExtensionModel,
      url: '/api/extensiontype',
      _type: 'extensionTypes'
    });

    // Store the course assets
    Origin.editor.data.courseAssets = new EditorCollection(null, {
      model: EditorCourseAssetModel,
      url: '/api/content/courseasset?_courseId=' + route1,
      _type: 'courseAssets'
    });
  }
});
