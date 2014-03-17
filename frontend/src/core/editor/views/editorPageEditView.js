define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');

  var EditorPageEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'savePage',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
    },

    inputBlur: function (event) {
      //@todo add the validation logic
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    savePage: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save(
        {
          title: this.$('.page-title').val(),
          body: this.$('.page-body').val(),
          linkText: this.$('.page-linktext').val(),
          graphic: {
            alt: this.$('.page-graphic-alt').val(),
            src: this.$('.page-graphic-src').val()
          },
          _type: this.$(".page-type").val(),
          _classes: this.$(".page-classes").val(),
          tenantId: 'noidyet'
        },
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Origin.trigger('editorView:fetchData');
          }
        }
      );
    }
  },
  {
    template: 'editorPageEdit'
  });

  return EditorPageEditView;

});
