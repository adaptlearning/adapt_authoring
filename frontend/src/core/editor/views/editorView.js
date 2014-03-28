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
  var EditorComponentModel = require('coreJS/editor/models/editorComponentModel');
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
      this.listenTo(Origin, 'editorView:fetchData', this.setupEditor);
      this.listenTo(Origin, 'editorView:copy', this.addToClipboard);
      this.listenTo(Origin, 'editorView:paste', this.pasteFromClipboard);
      this.render();
      this.setupEditor();
    },

    postRender: function() {
      this.renderEditorSidebar();
    },

// checks if data is loaded
// then create new instances of:
// Origin.editor.course, Origin.editor.contentObjects, Origin.editor.articles, Origin.editor.blocks
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

      if (Origin.editor.data.course) {
        _.each(Origin.editor.data, function(object) {
          object.fetch({reset:true});
        })
      } else {
        this.setupEditorModels();
        this.setupEditorCollections();
      }

    },

    setupEditorModels: function(editorModels) {
      Origin.editor.data.course = new EditorCourseModel({_id:this.currentCourseId});
    },

    setupEditorCollections: function(editorCollections) {
      Origin.editor.data.contentObjects = new EditorCollection(null, {
          model: EditorContentObjectModel,
          url: '/api/content/contentobject?_courseId=' + this.currentCourseId,
          _type: 'contentObjects'
      });
      
      Origin.editor.data.articles = new EditorCollection(null, {
          model: EditorArticleModel,
          url: '/api/content/article?_courseId=' + this.currentCourseId,
          _type: 'articles'
      });
      
      Origin.editor.data.blocks = new EditorCollection(null, {
          model: EditorBlockModel,
          url: '/api/content/block?_courseId=' + this.currentCourseId,
          _type: 'blocks'
      });

      Origin.editor.data.components = new EditorCollection(null, {
          model: EditorComponentModel,
          url: '/api/content/component?_courseId=' + this.currentCourseId,
          _type: 'components'
      });

      Origin.editor.data.clipboard = new EditorCollection(null, {
        model: EditorClipboardModel,
        url: '/api/content/clipboard?_courseId=' + this.currentCourseId + '&createdBy=' + Origin.sessionModel.get('id'),
        _type: 'clipboard'
      });
      
    },

    /*
      Archive off the clipboard
    */
    addToClipboard: function(model) {
    
      _.invoke(Origin.editor.data.clipboard.models, 'destroy');
      
      clipboard = new EditorClipboardModel();

      clipboard.set('referenceType', model.constructor._siblings);

      clipboard.set(model.constructor._siblings, [model.attributes]);
      
      var hasChildren = (model.constructor._children.length == 0) ? false : true;
      var currentModel = model;

      while (hasChildren) {
        var children = currentModel.getChildren();

        if (children) {
          var childrenArray = [];

          clipboard.set(children.models[0].constructor._siblings, children);

          currentModel = children.models[0];

          children.each(function(child) {
            if (child.getChildren()) {
              childrenArray.push(child.getChildren());
            }
          });

          hasChildren = (children.models[0].constructor._children.length == 0) ? false : true;
        } else {
          hasChildren = false;
        }
      }
  
      clipboard.save({_courseId: this.currentCourseId}, {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Origin.editor.data.clipboard.fetch({reset:true});
          }
        }
      );
    },

    pasteFromClipboard: function(targetModel) {
      var clipboard = Origin.editor.data.clipboard.models[0];
      this.createRecursive(clipboard.get('referenceType'), clipboard, targetModel.get('_id'));
    },

    createRecursive: function (type, clipboard, parentId) {
      var thisView = this;
      var items = clipboard.get(type);
      var Model = this.createModel(type);

      if (items && items.length) {
        _.each(items, function(item) {
          delete item._id;
          item._parentId = parentId;

          Model.save(
            item,
            {
              error: function() {
                alert('error adding new thingy');
              },
              success: function(model, response, options) {
                if (Model.constructor._children) {
                    thisView.createRecursive(Model.constructor._children, clipboard, Model.get('_id'));
                }
              }
            }
          );
        });
      } else {
        Origin.trigger('editorView:fetchData');
      }
    },

    createModel: function (type) {
      var model = false;
      switch (type) {
        case 'articles':
          model = new EditorArticleModel();
          break;
        case 'blocks':
          model = new EditorBlockModel();
          break;
        case 'components':
          break;
      }
      return model;
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

      console.log(this.currentView);
      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }

      Origin.trigger('editorSidebarView:addOverviewView');
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: Origin.editor.data.course
      }).$el);
    },

    renderEditorPage: function() {
      this.$('.editor-inner').html(new EditorPageView({
        model: Origin.editor.data.contentObjects.findWhere({_id: this.currentPageId}),
      }).$el);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
