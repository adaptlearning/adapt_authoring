define(function(require) {
  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/adaptbuilder');
  var BuilderView = require('coreJS/core/views/builderView');

  var ProjectDetailView = BuilderView.extend({

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

      this.model.save({name: this.$('#projectDetailTitle').val(),
        description: this.$('#projectDetailDescription').val(),
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
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
