define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorContentObjectsCollection = require('coreJS/editor/collections/editorContentObjectsCollection');
  var PageView = require('coreJS/editor/views/pageView');
  var PageCollection = require('coreJS/editor/collections/pageCollection');
  var PageModel = require('coreJS/editor/models/pageModel');
  
  var EditorView = BuilderView.extend({

    settings: {
      autoRender: false
    },

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link" : "addNewPage",
      "click a.load-page"     : "loadPage",
    },


     postRender: function() {
       this.renderEditorSidebar();
       if (this.currentView === "menu") {
         this.renderEditorMenu();
       }
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
      console.log('render editor page');
    },

    addNewPage: function(event) {
      event.preventDefault();

      console.log('Adding new page');
      Backbone.history.navigate('/page/new/' + this.model.get('_id'), {trigger: true});
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.dataLoaded);
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);

      // this.listenTo(this.model, 'sync', this.renderPageView);

        // this.currentView = options.currentView;
      // this.listenTo(this.model, 'sync', this.render);
      // this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      // this.preRender();
      // this.model.fetch();
    },

    dataLoaded: function() {
      this.render();
      this.renderPageView();
    },

    renderPageView: function() {
      var pageCollection = this.model.pageCollection;

      if (pageCollection.length != 0) {
        var list = $('<ul/>').appendTo('.editor-page-list');

        _.each(pageCollection.models, function(model) {
          list.append('<li><a class="load-page" data-page-id="' + model.get('_id') + '" href="#">' + model.get('title') + '</a></li>');
        }, this);
      }
    },

    loadPage: function(event) {
      event.preventDefault();
      var pageModel = new PageModel({_id:$(event.currentTarget).data('page-id')});
      pageModel.fetch();
      this.$('.editor').html(new PageView({model: pageModel}).$el);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
