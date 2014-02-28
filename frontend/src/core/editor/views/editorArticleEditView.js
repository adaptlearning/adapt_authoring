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
      'click .save-button'   : 'saveArticle',
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
      
      Backbone.history.navigate('/editor/page/' + this.model.get('_parentId'), {trigger: true});
    },

    saveArticle: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({
        title: this.$('.article-title').val(),
        body: this.$('.article-body').val()},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            console.log('after article save');
            Backbone.history.navigate('/editor/page/' + model.get('_parentId'), {trigger: true});
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
