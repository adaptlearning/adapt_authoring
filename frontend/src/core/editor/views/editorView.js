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
  var EditorComponentTypeModel = require('coreJS/editor/models/editorComponentTypeModel');
  var EditorConfigModel = require('coreJS/editor/models/editorConfigModel');

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
    // Origin.editor.course, Origin.editor.config, Origin.editor.contentObjects,
    // Origin.editor.articles, Origin.editor.blocks
    setupEditor: function() {
      this.loadedData = {
        clipboard: false,
        course: false,
        config: false,
        contentObjects: false,
        articles: false,
        blocks: false,
        components: false
      };

      Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedData) {
        this.loadedData[loadedData] = true;
        var allDataIsLoaded = _.every(this.loadedData, function(item) {
          return item === true;
        });

        if (allDataIsLoaded) {
          Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
          // Set our config (we only have one config at the moment)
          Origin.editor.data.config = Origin.editor.data.courseConfigs.models[0];
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

      // Store the component types
      Origin.editor.componentTypes = new EditorCollection(null, {
        model : EditorComponentTypeModel,
        url: '/api/componenttype'
      });
      
      Origin.editor.data.courseConfigs = new EditorCollection(null, {
        model: EditorConfigModel,
        url: '/api/content/config?_courseId=' + this.currentCourseId,
        _type: 'config'
      });
    },

    /*
      Archive off the clipboard
    */
    addToClipboard: function(model) {
      _.defer(_.bind(function() {
        _.invoke(Origin.editor.data.clipboard.models, 'destroy')
      }, this));

      var clipboard = new EditorClipboardModel();

      clipboard.set('referenceType', model._siblings);

      var hasChildren = (model._children && model._children.length == 0) ? false : true;
      var currentModel = model;
      var items = [currentModel];

      if (hasChildren) {
        // Recusively push all children into an array
        this.getAllChildren(currentModel, items);
      }

      // Sort items into their respective types
      _.each(items, function(item) {
        var matches = clipboard.get(item._siblings);
        if (matches) {
          this.mapValues(item);
          matches.push(item);
          clipboard.set(item._siblings, matches);
        } else {
          this.mapValues(item);
          clipboard.set(item._siblings, [item]);
        }
      }, this);

      clipboard.save({_courseId: this.currentCourseId}, {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.editor.data.clipboard.fetch({reset:true});
        }
      });
    },

    mapValues: function(item) {
      if (item.get('_componentType') && typeof item.get('_componentType') === 'object') {
        item.set('_componentType', item.get('_componentType')._id);
      }
    },

    getAllChildren: function (model, list) {
      var that = this;
      var children = model.getChildren();
      if (children && children.models.length) {
        children.each(function(child) {
          list.push(child);
          that.getAllChildren(child, list);
        });
      }
    },

    pasteFromClipboard: function(targetModel, sortOrder, layout) {
      var clipboard = Origin.editor.data.clipboard.models[0];
      var topitem = clipboard.get(clipboard.get('referenceType'))[0];
      if (topitem._layout) {
        topitem._layout = layout;
      }
      if (topitem._sortOrder) {
        topitem._sortOrder = sortOrder;
      }
      this.createRecursive(clipboard.get('referenceType'), clipboard, targetModel.get('_id'), false);
    },

    createRecursive: function (type, clipboard, parentId, oldParentId) {
      var thisView = this;
      var allitems = clipboard.get(type);
      var items = [];

      if (oldParentId) {
        items = _.filter(allitems, function(item) {
          return item._parentId == oldParentId;
        });
      } else {
        items = allitems;
      }

      if (items && items.length) {
        _.each(items, function(childitem) {
          var newModel = thisView.createModel(type);
          var oldPid = childitem._id;
          delete childitem._id;

          childitem._parentId = parentId;

          newModel.save(
            childitem,
            {
              error: function() {
                alert('error during paste');
              },
              success: function(model, response, options) {
                if (newModel._children) {
                  thisView.createRecursive(newModel._children, clipboard, model.get('_id'), oldPid);
                } else {
                  // We're done pasting, no more children to process
                  Origin.trigger('editorView:fetchData');
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
          model = new EditorComponentModel();
          break;
      }
      return model;
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

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
