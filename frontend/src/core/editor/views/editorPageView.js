define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorArticleView = require('coreJS/editor/views/editorArticleView');
  var EditorArticleModel = require('coreJS/editor/models/editorArticleModel');
  var EditorPasteZoneView = require('coreJS/editor/views/editorPasteZoneView');

  var EditorPageView = EditorOriginView.extend({

    tagName: 'div',

    className: 'page',

    events: {
      'click a.add-article'  : 'addArticle',
      'click a.edit-page'    : 'loadPageEdit',
      'click a.delete-page'  : 'deletePage',
      'click .paste-article' : 'onPaste',
      'click .paste-cancel'  : 'pasteCancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorView:moveArticle:' + this.model.get('_id'), this.render);
      this.listenTo(Origin, 'editorView:cutArticle:' + this.model.get('_id'), this.onCutArticle);
    },

    postRender: function() {
      this.addArticleViews();
      _.defer(_.bind(function(){
        this.trigger('pageView:postRender');
      }, this));
    },

    addArticleViews: function() {
      this.$('.page-articles').empty();
      Origin.trigger('editorPageView:removePageSubViews');

      // Insert the 'pre' paste zone for articles
      var prePasteArticle = new EditorArticleModel();
      prePasteArticle.set('_parentId', this.model.get('_id'));
      prePasteArticle.set('_type', 'article');
      prePasteArticle.set('_pasteZoneSortOrder', 1);

      this.$('.page-articles').append(new EditorPasteZoneView({model: prePasteArticle}).$el);

      this.model.getChildren().each(function(article) {
        this.$('.page-articles').append(new EditorArticleView({model: article}).$el);

        var sortOrder = article.get('_sortOrder');
        sortOrder++;
        article.set('_pasteZoneSortOrder', sortOrder);

        // Post-article paste zone - sort order of placeholder will be one greater
        this.$('.page-articles').append(new EditorPasteZoneView({model: article}).$el);
      }, this);
    },

    deletePage: function(event) {
      event.preventDefault();
      
      if (confirm(window.polyglot.t('app.confirmdeletepage'))) {
        if (this.model.destroy()) {
          this.remove();
          Origin.trigger('editorView:refreshPageList');
        }
      }
    },

    addArticle: function(event) {
      event.preventDefault();
      
      var thisView = this;
      var newPageArticleModel = new EditorArticleModel();
      newPageArticleModel.save({
        title: window.polyglot.t('app.placeholdernewarticle'),
        body: window.polyglot.t('app.placeholdereditthistext'),
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id')
      },
      {
        error: function() {
          alert('error adding new article');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    onCutArticle: function(view) {
      this.once('pageView:postRender', function() {
        view.showPasteZones();
      });

      this.render();
    },

  }, {
    template: 'editorPage'
  });

  return EditorPageView;

});
