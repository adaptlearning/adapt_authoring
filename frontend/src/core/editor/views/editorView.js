define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorPageView = require('coreJS/editor/views/editorPageView');
  var EditorCollection = require('coreJS/editor/collections/editorCollection');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorCourseModel = require('coreJS/editor/models/editorCourseModel');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');
  var EditorArticleModel = require('coreJS/editor/models/editorArticleModel');
  var EditorBlockModel = require('coreJS/editor/models/editorBlockModel');

  var EditorView = OriginView.extend({

    settings: {
      autoRender: false
    },

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link" : "addNewPage",
      "click a.load-page"     : "loadPage",
    },

    preRender: function(options) {
      this.currentCourseId = options.currentCourseId;
      this.currentPageId = options.currentPageId;
      this.currentView = options.currentView;
      this.listenTo(Origin, 'editorView:fetchData', this.setupEditor);
      this.render();
      this.setupEditor();
      
    },

    postRender: function() {
      this.renderEditorSidebar();
    },

// checks if data is loaded
// then create new instances of:
// Origin.editor.course, Origin.editor.contentObjects, Origin.editor.articles, Origin.editor.blocks
    setupEditor: function() {
      this.loadedData = {
        course:false,
        contentObjects:false,
        articles:false,
        blocks:false
      };

      Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedData) {
        this.loadedData[loadedData] = true;
        var allDataIsLoaded = _.every(this.loadedData, function(item) {
          return item === true;
        });

        if (allDataIsLoaded) {
          Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
          this.renderCurrentEditorView();
        }

      }, this);

      if (Origin.editor.data.course) {
        _.each(Origin.editor.data, function(object) {
          object.fetch({reset:true});
        })
      } else {
        this.setupEditorModels();
        this.setupEditorCollections();
      }

    },

    setupEditorModels: function(editorModels) {
      Origin.editor.data.course = new EditorCourseModel({_id:this.currentCourseId});
    },

    setupEditorCollections: function(editorCollections) {
      Origin.editor.data.contentObjects = new EditorCollection(null, {
          model: EditorContentObjectModel,
          url: '/api/content/contentobject?_courseId=' + this.currentCourseId,
          _type: 'contentObjects'
      });
      
      Origin.editor.data.articles = new EditorCollection(null, {
          model: EditorArticleModel,
          url: '/api/content/article?_courseId=' + this.currentCourseId,
          _type: 'articles'
      });
      
      Origin.editor.data.blocks = new EditorCollection(null, {
          model: EditorBlockModel,
          url: '/api/content/block?_courseId=' + this.currentCourseId,
          _type: 'blocks'
      });
      
    },
  
    //renders the editor view
    renderCurrentEditorView: function() {
      this.renderEditorSidebar();

      Origin.trigger('editorView:removeSubViews');

      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }

      Origin.trigger('editorSidebarView:addOverviewView');
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: Origin.editor.data.course
      }).$el);
    },

    renderEditorPage: function() {
      this.$('.editor-inner').html(new EditorPageView({
        model: Origin.editor.data.contentObjects.findWhere({_id: this.currentPageId}),
      }).$el);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
