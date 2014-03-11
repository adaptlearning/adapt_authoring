define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorPageView = require('coreJS/editor/views/editorPageView');
  var EditorCollection = require('coreJS/editor/collections/editorCollection');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorCourseModel = require('coreJS/editor/models/editorCourseModel');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');
  var EditorArticleModel = require('coreJS/editor/models/editorArticleModel');
  var EditorBlockModel = require('coreJS/editor/models/editorBlockModel');
  var EditorClipboardModel = require('coreJS/editor/models/editorClipboardModel');

  var EditorView = EditorOriginView.extend({

    settings: {
      autoRender: false
    },

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link" : "addNewPage",
      "click a.load-page"     : "loadPage",
    },

    preRender: function(options) {
      this.currentCourseId = options.currentCourseId;
      this.currentPageId = options.currentPageId;
      this.currentView = options.currentView;
      this.listenTo(Origin, 'editor:fetchData', this.setupEditor);
      this.listenTo(Origin, 'editor:copy', this.addToClipboard);
      this.listenTo(Origin, 'editor:paste', this.pasteFromClipboard);
      this.render();
      this.setupEditor();
    },

    postRender: function() {
      this.renderEditorSidebar();
    },

    setupEditor: function() {
      this.loadedData = {
        clipboard: false,
        course: false,
        contentObjects: false,
        articles: false,
        blocks: false
      };

      Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedData) {
        this.loadedData[loadedData] = true;
        var allDataIsLoaded = _.every(this.loadedData, function(item) {
          return item === true;
        });

        if (allDataIsLoaded) {
          Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
          this.renderCurrentEditorView();
        }

      }, this);

      if (Origin.editor.course) {
        _.each(Origin.editor, function(object) {
          object.fetch({reset:true});
        })
      } else {
        this.setupEditorModels();
        this.setupEditorCollections();
      }

    },

    setupEditorModels: function(editorModels) {
      Origin.editor.course = new EditorCourseModel({_id:this.currentCourseId});
    },

    setupEditorCollections: function(editorCollections) {
      Origin.editor.contentObjects = new EditorCollection(null, {
          model: EditorContentObjectModel,
          url: '/api/content/contentobject?_courseId=' + this.currentCourseId,
          _type: 'contentObjects'
      });
      
      Origin.editor.articles = new EditorCollection(null, {
          model: EditorArticleModel,
          url: '/api/content/article?_courseId=' + this.currentCourseId,
          _type: 'articles'
      });
      
      Origin.editor.blocks = new EditorCollection(null, {
          model: EditorBlockModel,
          url: '/api/content/block?_courseId=' + this.currentCourseId,
          _type: 'blocks'
      });

      Origin.editor.clipboard = new EditorCollection(null, {
        model: EditorClipboardModel,
        url: '/api/content/clipboard?_courseId=' + this.currentCourseId + '&createdBy=' + Origin.sessionModel.get('id'),
        _type: 'clipboard'
      });
      
    },

    /*
      Archive off the clipboard
    */
    addToClipboard: function(model) {
    
      _.invoke(Origin.editor.clipboard.models, 'destroy');
      
      clipboard = new EditorClipboardModel();

      clipboard.set('referencesId', model.get('_id')); 
      clipboard.set('referenceType', model.get('_type'));

      switch (model.get('_type')) {
        case 'article':
          clipboard.set('referenceType', 'articles');

          var blocks = model.getChildren();
          var components = [];
          clipboard.set('articles', [model.attributes]);
          clipboard.set('blocks', blocks);

          blocks.each(function(block){
            if(block.getChildren()) {
              components.push(block.getChildren());
            }
          });

          clipboard.set('components', components);
          break;

        case 'block':
          clipboard.set('blocks', [model.attributes]);
          clipboard.set('components', model.getChildren());
          break;
      }

      clipboard.save({_courseId: this.currentCourseId}, {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            alert('Clipboard data saved');
            Origin.editor.clipboard.fetch({reset:true});
          }
        }
      );
    },

    createBlock: function(block) {
      var newBlockModel = new EditorBlockModel();

      newBlockModel.save(block,
      {
        error: function() {
          alert('error adding new block');
        },
        success: function() {
          return this.get('_id');
        }
      });
    },

    createArticle: function(article) {
      var newArticleModel = new EditorArticleModel();

      newArticleModel.save(article,
      {
        error: function() {
          alert('error adding new article');
        },
        success: function() {
          var blocks = clipboard.get('block');
          if (blocks) {
            _.each(blocks, function(block) {
              block._id = null;
              block._parentId = newArticleModel.get('_id');
              var b = thisView.createBlock(block);
            });
          }
        }
      });

      return newArticleModel;
    },
    
    pasteFromClipboard: function(targetModel) {
      var thisView = this;
      var clipboard = Origin.editor.clipboard.models[0];

      switch (targetModel.get('_type')) {
        case 'page':
          var articles = clipboard.get('articles');
          if (articles) {
            _.each(articles, function(article) {
              article._id = null;
              article._parentId = targetModel.get('_id');
              var a = thisView.createArticle(article);
              Origin.trigger('editor:fetchData');
            });
          }
          break;
        case 'block':
          break;
        //@TODO: Add components, content objects
      }
      
    },

    clearClipboard: function() {
      var clipboard = new EditorClipboardModel({'referencesId':'5318853f6daf89d43a000008'});
      clipboard.fetch();
      clipboard.destroy();
    },

    renderCurrentEditorView: function() {
      this.renderEditorSidebar();

      Origin.trigger('editor:removeSubViews');

      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }

      console.log('addOverviewView');
      Origin.trigger('editorSidebar:addOverviewView');
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: Origin.editor.course
      }).$el);
    },

    renderEditorPage: function() {
      this.$('.editor-inner').html(new EditorPageView({
        model: Origin.editor.contentObjects.findWhere({_id: this.currentPageId}),
      }).$el);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
