define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorArticleEditView = OriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'saveArticle',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editor:removeSubViews', this.remove);
    },

    inputBlur: function (event) {
      //@todo add the validation logic
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebar:removeEditView', this.model);
    },

    saveArticle: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({
        title: this.$('.article-title').val(),
        body: this.$('.article-body').val(),
        _sortOrder: this.$(".article-position").filter(":selected").val()},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Origin.trigger('editor:fetchData');
          }
        }
      );
    }
  },
  {
    template: 'editorArticleEdit'
  });

  return EditorArticleEditView;

});
