define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');
  var PageArticleModel = require('coreJS/editor/models/PageArticleModel');
  var PageArticleView = require('coreJS/editor/views/PageArticleView');

  var PageView = BuilderView.extend({

    tagName: 'div',

    className: 'page',

    events: {
      'click a.delete-link' : 'deletePage',
      'click a.add-article' : 'addArticle'
    },

    deletePage: function(event) {
      event.preventDefault();
      if (confirm('Are you sure you want to delete this page?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    },

    appendNewArticle: function(newPageArticleModel) {
      this.$('.page-articles').append(new PageArticleView({model: newPageArticleModel}).$el);
    },

    addArticle: function(event) {
      event.preventDefault();
      
      var thisView = this;
      var newPageArticleModel = new PageArticleModel();

      newPageArticleModel.save({name: 'New article', 
        description: 'Edit this text',
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('error adding new article');
          },
          success: function() {
            thisView.appendNewArticle(newPageArticleModel);
          }
        }
      );
    }
    
  }, {
    template: 'page'
  });

  return PageView;

});