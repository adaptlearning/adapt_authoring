define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');
  var BuilderView = require('coreJS/app/views/builderView');

  var PageEditView = BuilderView.extend({

    settings: {
      autoRender: false
    },
    
    tagName: "div",

    className: "project",

    events: {
      'click button#saveButton' : 'savePage',
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
      
      Backbone.history.navigate('/editor', {trigger: true});
    },

    savePage: function(event) {
      event.preventDefault();

      this.model.save({name: this.$('#pageTitle').val(),
        description: this.$('#pageDescription').val(),
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Backbone.history.navigate('/editor', {trigger: true});
          }
        }
      );
    }
  },
  {
    template: 'pageEdit'
  });

  return PageEditView;

});
