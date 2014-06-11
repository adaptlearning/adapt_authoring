define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorArticleEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'saveArticle',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    inputBlur: function (event) {
      //@todo add the validation logic
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveArticle: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({
        _parentId: this.$('.block-parent').find(':selected').val(),
        title: this.$('.article-title').val(),
        body: this.$('.article-body').val(),
        _sortOrder: this.$('.article-position').val()
      },
      {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    }

  },
  {
    template: 'editorArticleEdit'
  });

  return EditorArticleEditView;

});
