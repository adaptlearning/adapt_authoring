define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorContentObjectsCollection = require('coreJS/editor/collections/editorContentObjectsCollection');
  
  var EditorView = BuilderView.extend({

    tagName: "div",

    className: "editor",

    initialize: function(options) {
      this.currentView = options.currentView;
      this.listenTo(this.model, 'sync', this.render);
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      this.preRender();
      this.model.fetch();
    },

    preRender: function(options) {
    },

    postRender: function() {
      this.renderEditorSidebar();
      if (this.currentView === "menu") {
        this.renderEditorMenu();
      }
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
      console.log('render editor page');
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
