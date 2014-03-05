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
      this.render();
      //this.listenTo(Origin, 'editor:syncData', this.fetchEditorData);
      this.setupEditor();
    },

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
          this.renderCurrentEditorView();
        }

      }, this);

      this.setupEditorModels();
      this.setupEditorCollections();

    },

    setupEditorModels: function(editorModels) {
      Origin.editor.course = new EditorCourseModel({_id:this.currentCourseId});
    },

    setupEditorCollections: function(editorCollections) {
      Origin.editor.contentObjects = new EditorCollection(null, {
          model: EditorContentObjectModel,
          url: '/api/content/contentobject?_courseId=' + this.currentCourseId,
          _type: 'contentObjects'
      });
      
      Origin.editor.articles = new EditorCollection(null, {
          model: EditorArticleModel,
          url: '/api/content/article?_courseId=' + this.currentCourseId,
          _type: 'articles'
      });
      
      Origin.editor.blocks = new EditorCollection(null, {
          model: EditorBlockModel,
          url: '/api/content/block?_courseId=' + this.currentCourseId,
          _type: 'blocks'
      });
      
    },

    fetchEditorData: function(dataToBeFetched) {
      _.each(dataToBeFetched, function(dataObject) {
        Origin.editor[dataObject].fetch({reset:true});
      })
    },
    
    renderCurrentEditorView: function() {
      this.renderEditorSidebar();
      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: Origin.editor.course
      }).$el);
    },

    renderEditorPage: function() {
      this.$('.editor-inner').html(new EditorPageView({
        model: this.model,
      }).$el);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
