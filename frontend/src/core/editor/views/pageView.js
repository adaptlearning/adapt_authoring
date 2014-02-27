define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');
  var PageArticleModel = require('coreJS/editor/models/PageArticleModel');
  var PageArticleView = require('coreJS/editor/views/PageArticleView');
  var PageArticleCollection = require('coreJS/editor/collections/PageArticleCollection');

  var PageView = BuilderView.extend({

    settings: {
      autoRender: false
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.render);
      this.pageArticleCollection = new PageArticleCollection({_parentId:this.model.get('_id')});
      this.pageArticleCollection.fetch();
      this.listenTo(this.pageArticleCollection, 'sync', this.addArticleViews);
    },

    addArticleViews: function() {
      this.$('.page-articles').empty();

      _.each(this.pageArticleCollection.models, function(article) {
        this.$('.page-articles').append(new PageArticleView({model: article}).$el);
      }, this);
    },

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

      newPageArticleModel.save({name: '{Your new article}', 
        description: '{Edit this text...}',
        _parentId: thisView.model.get('_id'),
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