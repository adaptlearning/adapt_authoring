define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');
  var BuilderView = require('coreJS/app/views/builderView');

  var PageArticleEditView = BuilderView.extend({

    settings: {
      autoRender: false
    },
    
    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'savePage',
      'click .cancel-button' : 'cancel'
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
      
      Backbone.history.navigate('/editor/view/' + AdaptBuilder.currentProjectId, {trigger: true});
    },

    savePage: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({name: this.$('.article-title').val(),
        description: this.$('.article-description').val(),
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Backbone.history.navigate('/editor/view/' + AdaptBuilder.currentProjectId, {trigger: true});
          }
        }
      );
    }
  },
  {
    template: 'pageArticleEdit'
  });

  return PageArticleEditView;

});
