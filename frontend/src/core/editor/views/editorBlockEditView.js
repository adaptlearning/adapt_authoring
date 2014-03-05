define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorBlockEditView = OriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'saveBlock',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebar:removeEditView', this.remove);
    },

    inputBlur: function (event) {
      //@todo add the validation logic
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebar:removeEditView', this.model);
    },

    saveBlock: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({
        title: this.$('.block-title').val(),
        body: this.$('.block-body').val()},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Origin.trigger('editor:fetchData');
            //Backbone.history.navigate('/editor/page/' + model.get('_parentId'), {trigger: true});
          }
        }
      );
    }
  },
  {
    template: 'editorBlockEdit'
  });

  return EditorBlockEditView;

});
