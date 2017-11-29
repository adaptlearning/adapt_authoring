// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');

  var ArticleModel = require('core/models/articleModel');
  var ContentModel = require('core/models/contentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageArticleView = require('./editorPageArticleView');
  var EditorPasteZoneView = require('../../global/views/editorPasteZoneView');

  var EditorPageView = EditorOriginView.extend({
    className: 'page',
    tagName: 'div',
    childrenCount: 0,
    childrenRenderedCount: 0,

    events: _.extend({}, EditorOriginView.prototype.events, {
      'click a.add-article': 'addArticle',
      'click a.page-edit-button': 'openContextMenu',
      'dblclick .page-detail': 'loadPageEdit',
      'click .paste-cancel': 'onPasteCancel'
    }),

    preRender: function() {
      this.setupChildCount();

      this.listenTo(Origin, {
        'editorView:removeSubViews': this.remove,
        'pageView:itemRendered': this.evaluateChildStatus
      });
      this.listenTo(Origin, 'editorView:moveArticle:' + this.model.get('_id'), this.render);
      this.listenTo(Origin, 'editorView:cutArticle:' + this.model.get('_id'), this.onCutArticle);
    },

    resize: function() {
      _.defer(_.bind(function() {
        var windowHeight = $(window).height();
        this.$el.height(windowHeight - this.$el.offset().top);
      }, this));
    },

    setupChildCount: function() {
      var articles = Origin.editor.data.articles.where({_parentId: this.model.get('_id')});
      var articleList = [], blockList = [];

      _.each(articles, function(article) {
        articleList.push(article.get('_id'));
      });

      var blocks = _.filter(Origin.editor.data.blocks.models, function (block) {
        return _.contains(articleList, block.get('_parentId'));
      });

      _.each(blocks, function(block) {
        blockList.push(block.get('_id'));
      });

      var components = _.filter(Origin.editor.data.components.models, function(component) {
        return _.contains(blockList, component.get('_parentId'));
      });

      this.childrenCount = articles.length + blocks.length + components.length;
    },

    evaluateChildStatus: function() {
      this.childrenRenderedCount++;
    },

    postRender: function() {
      this.addArticleViews();

      _.defer(_.bind(function(){
        this.resize();
        this.trigger('pageView:postRender');
        this.setViewToReady();
      }, this));
    },

    addArticleViews: function() {
      this.$('.page-articles').empty();
      Origin.trigger('editorPageView:removePageSubViews');
      // Insert the 'pre' paste zone for articles
      var prePasteArticle = new ArticleModel({
        _parentId: this.model.get('_id'),
        _type: 'article',
        _pasteZoneSortOrder: 1
      });
      this.$('.page-articles').append(new EditorPasteZoneView({ model: prePasteArticle }).$el);
      // Iterate over each article and add it to the page
      this.model.getChildren().each(this.addArticleView, this);
    },

    addArticleView: function(articleModel, scrollIntoView, addNewBlock) {
      var newArticleView = new EditorPageArticleView({ model: articleModel });
      var sortOrder = articleModel.get('_sortOrder');
      // Add syncing class
      if (articleModel.isNew()) {
        newArticleView.$el.addClass('syncing');
      }
      scrollIntoView = scrollIntoView || false;

      this.$('.page-articles').append(newArticleView.$el);

      if (scrollIntoView) {
        $.scrollTo(newArticleView.$el, 200);
      }
      // Increment the 'sortOrder' property
      articleModel.set('_pasteZoneSortOrder', sortOrder++);
      // Post-article paste zone - sort order of placeholder will be one greater
      this.$('.page-articles').append(new EditorPasteZoneView({model: articleModel}).$el);
      // Return the article view so syncing can be shown
      return newArticleView;
    },

    addArticle: function(event) {
      event && event.preventDefault();

      var _this = this;
      var newPageArticleModel = new ArticleModel({
        title: Origin.l10n.t('app.placeholdernewarticle'),
        displayTitle: Origin.l10n.t('app.placeholdernewarticle'),
        body: '',
        _parentId: _this.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        _type:'article'
      });

      newPageArticleModel.save(null, {
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.erroraddingarticle')
          });
        },
        success: function(model, response, options) {
          Origin.editor.data.articles.add(model);
          var newArticleView = _this.addArticleView(newPageArticleModel);
          newArticleView.$el.removeClass('syncing').addClass('synced');
          newArticleView.addBlock();
        }
      });
    },

    loadPageEdit: function(event) {
      event && event.preventDefault();
      var courseId = this.model.get('_courseId');
      var id = this.model.get('_id');
       Origin.router.navigateTo('editor/' + courseId + '/page/' + id + '/edit');
    },

    // TODO fragile HACK, refactor context menu code to allow what I want to do later...
    openContextMenu: function(event) {
      if(!event) return console.log('Error: needs a current target to attach the menu to...');
      event.preventDefault() && event.stopPropagation();

      var fakeModel = new Backbone.Model({ _id: this.model.get('_id'), _type: 'page-min' });
      var fakeView = new Backbone.View({ model: fakeModel });

      this.listenTo(fakeView, {
        'contextMenu:page-min:edit': this.loadPageEdit,
        'contextMenu:page-min:copyID': this.onCopyID
      });
      Origin.trigger('contextMenu:open', fakeView, event);
    },

    onCutArticle: function(view) {
      this.once('pageView:postRender', view.showPasteZones);
      this.render();
    }
  }, {
    template: 'editorPage'
  });

  return EditorPageView;
});
