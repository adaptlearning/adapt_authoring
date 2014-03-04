define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorPageView = require('coreJS/editor/views/editorPageView');
  var EditorCollection = require('coreJS/editor/collections/editorCollection');
  var EditorModel = require('coreJS/editor/models/editorModel');

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
      Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function() {
        if (Origin.editor.contentObjects.models.length > 0
            && Origin.editor.articles.models.length > 0
            && Origin.editor.blocks.models.length > 0
            && Origin.editor.components.models.length > 0
            && Origin.editor.config.hasChanged()
            && Origin.editor.course.hasChanged()) {
          console.log('loaded data');
          this.renderCurrentEditorView();
        }
        
      }, this);
      var editorModels = [
        /*{modelName:'config', url: '/api/content/contentobject?_courseId=4598630869084596048396845'},*/
        {modelName:'course', url: '/api/content/contentobject?_courseId=4598630869084596048396845'}
      ];
      var editorCollections = [
        {collectionName:'contentObjects', url:'contentobject'},
        {collectionName:'articles', url:'article'},
        {collectionName:'blocks', url:'block'},
        {collectionName:'components', url:'component'}
      ]
      this.setupEditorModels(editorModels);
      this.setupEditorCollections(editorCollections);

    },

    setupEditorModels: function(editorModels) {
      _.each(editorModels, function(editorModel) {
        Origin.editor[editorModel.modelName] = new EditorModel({
          url: '/api/content/' + editorModel.url + '?_courseId=' + this.model.get('_id')
        });
      }, this);
    },

    setupEditorCollections: function(editorCollections) {

      _.each(editorCollections, function(editorCollection) {
        
        Origin.editor[editorCollection.collectionName] = new EditorCollection(null, {
          url: _.bind(function() {
            return '/api/content/' + editorCollection.url;
          }, this)
        });

      }, this);
      
    },

    syncEditorData: function(dataToBeSynced) {
      _.each(dataToBeSynced, function(dataObject) {
        Origin.editor[dataObject].sync();
      })
    },
    
    renderCurrentEditorView: function() {
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
        model: Origin.editor.course
      }).$el);
      // 'api/content/' + this.model.get('_id') + '/articles'
    },

    renderEditorPage: function() {
      console.log(this.model);
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
