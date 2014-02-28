define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorContentObjectsCollection = require('coreJS/editor/collections/editorContentObjectsCollection');
  var EditorPageView = require('coreJS/editor/views/editorPageView');
  var EditorPageCollection = require('coreJS/editor/collections/editorPageCollection');
  var EditorPageModel = require('coreJS/editor/models/editorPageModel');
  var SidebarPageEditView = require('coreJS/editor/views/sidebarPageEditView');
  var PageModel = require('coreJS/editor/models/editorPageModel');

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
      this.currentView = options.currentView;
      this.listenTo(this.model, 'sync', this.render);
      this.model.fetch();
      this.setupEditor();
    },

    setupEditor: function() {
      Origin.editor.config = {};
      Origin.editor.course = this.model;
      Origin.editor.contentObjects = {};
      Origin.editor.articles = {};
      Origin.editor.blocks = {};
      Origin.editor.components = {};
      console.log(Origin);
    },
    
    postRender: function() {
      this.renderEditorSidebar();

      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }
      // if (this.currentView === "menu") {
      //   this.renderEditorMenu();
      // } else if (this.currentView === "page") {
      //   this.renderEditorPage();
      // }
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: this.model, 
        collection: new EditorContentObjectsCollection({
          url: '/data/contentObjects.json'
        })
      }).$el);
      // 'api/content/' + this.model.get('_id') + '/articles'
    },

    renderEditorPage: function() {

      this.$('.editor-inner').html(new EditorPageView({
        model: this.model
      }).$el);

      console.log('rendering page editing view');
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
