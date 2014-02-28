define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorArticleModel = require('coreJS/editor/models/editorArticleModel');

  var PageArticleView = BuilderView.extend({

    tagName: 'div',

    className: 'page-article',

    events: {
      'click a.page-article-delete' : 'deletePageArticle'
    },

    
    deletePageArticle: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this article?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    }
  }, {
    template: 'pageArticle'
  });

  return PageArticleView;

});