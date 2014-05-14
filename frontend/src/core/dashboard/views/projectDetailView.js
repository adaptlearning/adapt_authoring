define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorConfigModel = require('coreJS/editor/models/editorConfigModel');

  var ProjectDetailView = OriginView.extend({

    settings: {
      autoRender: false
    },

    tagName: "div",

    className: "project",

    events: {
      'click button#saveButton' : 'saveProject',
      'click button#cancelButton' : 'cancel'
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.render);
      if (!this.model._id) {
        this.render();
      }
    },

    inputBlur: function (event) {
      //@todo add the validation logic
    },

    cancel: function (event) {
      event.preventDefault();

      Backbone.history.navigate('/dashboard', {trigger: true});
    },

    saveProject: function(event) {
      event.preventDefault();

      this.model.save({title: this.$('#projectDetailTitle').val(),
        body: this.$('#projectDetailDescription').val()
        },
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(result) {
            // Add config
            var config = new EditorConfigModel();
            config.save({'_courseId': result.get('_id')});
            Backbone.history.navigate('/dashboard', {trigger: true});
          }
        }
      );
    }
  },
  {
    template: 'projectDetail'
  });

  return ProjectDetailView;

});
