define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  
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
      console.log('render editor menu');
    },

    renderEditorPage: function() {
      console.log('render editor page');
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
