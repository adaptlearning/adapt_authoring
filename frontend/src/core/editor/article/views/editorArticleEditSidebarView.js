// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/app/origin');
  var SidebarItemView = require('core/sidebar/views/sidebarItemView');

  var EditorArticleEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-article-edit-sidebar-save': 'saveEditing',
      'click .editor-article-edit-sidebar-cancel': 'cancelEditing'
    },

    postRender: function() {
      
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-article-edit-sidebar-save', window.polyglot.t('app.saving'));
      Origin.trigger('editorArticleEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
    }
  }, {
    template: 'editorArticleEditSidebar'
  });

  return EditorArticleEditSidebarView;
});
