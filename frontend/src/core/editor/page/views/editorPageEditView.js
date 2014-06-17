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

    initialize: function() {
      //this.listenTo(Origin, 'editingOverlay:views:remove', this.remove);
      this.listenTo(Origin, 'editorPageEditSidebar:views:save', this.saveEditing);
      this.render();
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
      console.log('saving');
      var model = this.model;

      model.save({
        title: this.$('.page-title').val(),
        body: this.$('.page-body').val(),
        linkText: this.$('.page-linktext').val(),
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
