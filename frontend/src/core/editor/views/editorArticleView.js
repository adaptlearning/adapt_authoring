define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorBlockView = require('coreJS/editor/views/editorBlockView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorBlockCollection = require('coreJS/editor/collections/editorBlockCollection');

  var EditorArticleView = OriginView.extend({

    tagName: 'div',

    className: 'page-article',

    events: {
      'click a.add-block'           : 'addBlock',
      'click a.page-article-edit'   : 'loadPageEdit',
      'click a.page-article-delete' : 'deletePageArticle'
    },

    preRender: function() {
      this.EditorBlockCollection = new EditorBlockCollection({_parentId:this.model.get('_id')});
      this.listenTo(this.EditorBlockCollection, 'sync', this.addBlockViews);
      this.EditorBlockCollection.fetch();
    },

    addBlock: function(event) {
      event.preventDefault();

      var thisView = this;
      var newBlockModel = new EditorModel({urlRoot: '/api/content/block'});

      newBlockModel.save({
        title: '{Your new block}',
        body: '{Edit this text...}',
        _parentId: thisView.model.get('_id')},
        {
          error: function() {
            alert('error adding new block');
          },
          success: function() {
            thisView.EditorBlockCollection.fetch();
          }
        }
      );
    },

    addBlockViews: function() {
      this.$('.page-article-blocks').empty();

      _.each(this.EditorBlockCollection.models, function(block) {
        this.$('.page-article-blocks').append(new EditorBlockView({model: block}).$el);
      }, this);
    },
    
    deletePageArticle: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this article?')) {
        console.log('deleting article', this.model);
        this.model.destroy({
          success: function(success) {
            console.log('success', success);
          }, 
          error: function(error) {
            console.log('error', error);
          }
        })
        if (this.model.destroy()) {
          console.log('deleting article or should have');
          this.remove();
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebar:addEditView', this.model);
    }

  }, {
    template: 'editorArticle'
  });

  return EditorArticleView;

});