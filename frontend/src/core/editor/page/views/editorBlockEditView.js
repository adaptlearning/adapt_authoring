define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorBlockEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .editing-overlay-panel-title': 'toggleContentPanel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorBlockEditSidebar:views:save', this.saveBlock);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    toggleContentPanel: function(event) {
      event.preventDefault();
      if (!$(event.currentTarget).hasClass('active')) { 
        this.$('.editing-overlay-panel-title').removeClass('active');
        $(event.currentTarget).addClass('active')
        this.$('.editing-overlay-panel-content').slideUp();
        $(event.currentTarget).siblings('.editing-overlay-panel-content').slideDown();
      }
    },

    saveBlock: function() {

      var model = this.model;

      model.save({
        _parentId: this.$('.block-parent').find(':selected').val(),
        title: this.$('.block-title').val(),
        body: this.$('.block-body').val(),
        _sortOrder: this.$('.block-position').val()
      },
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: _.bind(function() {
            Origin.trigger('editingOverlay:views:hide');
            Origin.trigger('editorView:fetchData');
            Backbone.history.history.back();
            this.remove();
          }, this)
      });
    }
  },
  {
    template: 'editorBlockEdit'
  });

  return EditorBlockEditView;

});
