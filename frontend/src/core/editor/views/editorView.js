define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorContentObjectsCollection = require('coreJS/editor/collections/editorContentObjectsCollection');
  var EditorPageView = require('coreJS/editor/views/editorPageView');
  var EditorPageCollection = require('coreJS/editor/collections/editorPageCollection');
  var EditorPageModel = require('coreJS/editor/models/editorPageModel');
  var SidebarPageEditView = require('coreJS/editor/views/sidebarPageEditView');
  var PageModel = require('coreJS/editor/models/editorPageModel');
  var EditorCollection = require('coreJS/editor/collections/editorCollection');

  var EditorView = OriginView.extend({

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
      this.currentView = options.currentView;
      this.listenTo(this.model, 'sync', this.render);
      this.listenTo(Origin, 'editor:syncData', this.syncEditorData);
      this.model.fetch();
      this.setupEditor();
    },

    setupEditor: function() {
      Origin.on('editorCollection:dataLoaded', function() {
        console.log(Origin);
      });
      var editorModels = [
        {modelName:'config'},
        {modelName:'course'}
      ];
      var editorCollections = [
        {collectionName:'contentObjects', url:'/data/contentObjects.json'},
        {collectionName:'articles', url:'/data/articles.json'},
        {collectionName:'blocks', url:'/data/blocks.json'},
        {collectionName:'components', url:'/data/components.json'}
      ]
      //this.setupEditorModels(editorModels);
      this.setupEditorCollections(editorCollections);

    },

    setupEditorModels: function(editorModels) {
      _.each(editorModels, function(editorModel) {
        Origin.editor[editorModel.modelName] = new EditorModel({
          url: '/data/' + editorModel.url + '.json'
        });
      });
    },

    setupEditorCollections: function(editorCollections) {

      _.each(editorCollections, function(editorCollection) {
        
        Origin.editor[editorCollection.collectionName] = new EditorCollection(null, {
          url: _.bind(function() {
            return editorCollection.url;
          }, this)
        });

      }, this);
      
    },

    syncEditorData: function(dataToBeSynced) {
      _.each(dataToBeSynced, function(dataObject) {
        Origin.editor[dataObject].sync();
      })
    },
    
    postRender: function() {
      this.renderEditorSidebar();

      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }
      // if (this.currentView === "menu") {
      //   this.renderEditorMenu();
      // } else if (this.currentView === "page") {
      //   this.renderEditorPage();
      // }
    },

    renderEditorSidebar: function() {
      this.$el.append(new EditorSidebarView().$el);
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: this.model, 
        collection: new EditorContentObjectsCollection({
          url: '/data/contentObjects.json'
        })
      }).$el);
      // 'api/content/' + this.model.get('_id') + '/articles'
    },

    renderEditorPage: function() {

      this.$('.editor-inner').html(new EditorPageView({
        model: this.model
      }).$el);

      console.log('rendering page editing view');
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
