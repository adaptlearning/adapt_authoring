define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorPageEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .editing-overlay-panel-title': 'toggleContentPanel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorPageEditSidebar:views:save', this.saveEditing);
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

    saveEditing: function() {
      this.model.save({
        title: this.$('.page-title').val(),
        displayTitle: this.$('.page-displayTitle').val(),
        body: tinyMCE.get('page-body').getContent(),
        linkText: this.$('.page-linktext').val(),
        duration: this.$('.page-duration').val(),
        _graphic: {
          alt: this.$('.page-graphic-alt').val(),
          src: this.$('.page-graphic-src').val()
        },
        _type: this.$(".page-type").val(),
        _classes: this.$(".page-classes").val()
      }, {
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
    template: 'editorPageEdit'
  });

  return EditorPageEditView;

});
