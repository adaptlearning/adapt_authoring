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

    postRender: function() {
      this.renderExtensionEditor('block');
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
      var extensionJson = {};

      extensionJson = this.getExtensionJson('block');

      var model = this.model;

      model.save({
        title: this.$('.setting-title').val(),
        displayTitle: this.$('.setting-displaytitle').val(),
        _classes: this.$('.setting-class').val(),
        body: tinyMCE.get('setting-body').getContent(),
        _extensions: extensionJson
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
