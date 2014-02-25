define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  
  var EditorView = BuilderView.extend({

    tagName: "div",

    className: "editor",

    preRender: function() {
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      console.log(this.model);
    },

    postRender: function() {
      this.renderEditorSidebar();
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      console.log('renderEditorMenu');
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
