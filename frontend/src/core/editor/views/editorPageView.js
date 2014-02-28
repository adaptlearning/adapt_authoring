define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorArticleModel = require('coreJS/editor/models/editorArticleModel');
  var EditorArticleView = require('coreJS/editor/views/editorArticleView');
  var EditorArticleCollection = require('coreJS/editor/collections/editorArticleCollection');

  var PageView = BuilderView.extend({

    settings: {
      autoRender: false
    },

    tagName: 'div',

    className: 'page',

    events: {
      'click a.delete-link' : 'deletePage',
      'click a.add-article' : 'addArticle'
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.render);
      this.EditorArticleCollection = new EditorArticleCollection({_parentId:this.model.get('_id')});
      this.EditorArticleCollection.fetch();
      this.listenTo(this.EditorArticleCollection, 'sync', this.addArticleViews);
    },

    addArticleViews: function() {
      this.$('.page-articles').empty();

      _.each(this.EditorArticleCollection.models, function(article) {
        this.$('.page-articles').append(new EditorArticleView({model: article}).$el);
      }, this);
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
      this.$('.page-articles').append(new EditorArticleView({model: newPageArticleModel}).$el);
    },

    addArticle: function(event) {
      event.preventDefault();
      
      var thisView = this;
      var newPageArticleModel = new EditorArticleModel();

      newPageArticleModel.save({title: '{Your new article}', 
        body: '{Edit this text...}',
        _parentId: thisView.model.get('_id')},
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
