define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorSidebarView = require('coreJS/editor/views/editorSidebarView');
  var EditorMenuView = require('coreJS/editor/views/editorMenuView');
  var EditorContentObjectsCollection = require('coreJS/editor/collections/editorContentObjectsCollection');
  var EditorPageView = require('coreJS/editor/views/editorPageView');
  var EditorPageCollection = require('coreJS/editor/collections/editorPageCollection');
  var EditorPageModel = require('coreJS/editor/models/editorPageModel');
  
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

    preRender: function(options) {
      this.currentView = options.currentView;
      this.listenTo(this.model, 'sync', this.render);
      this.model.fetch();
    },
    
    postRender: function() {
      this.renderEditorSidebar();
      if (this.currentView === "menu") {
        this.renderEditorMenu();
      } else if (this.currentView === "page") {
        this.renderEditorPage();
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
      /*console.log('rendering page editing view');
      this.$('.editor-inner').html(new EditorMenuView({
        model: this.model, 
        collection: new EditorContentObjectsCollection({
          url: '/data/contentObjects.json'
        })
      }).$el);*/
      //EditorPageView
      var pageCollection = this.model.pageCollection;

      if (pageCollection.length != 0) {
        var list = $('<ul/>').appendTo('.editor-page-list');

        _.each(pageCollection.models, function(model) {
          list.append('<li><a class="load-page" data-page-id="' + model.get('_id') + '" href="#">' + model.get('title') + '</a></li>');
        }, this);
      }
    }

    /*addNewPage: function(event) {
      event.preventDefault();

      console.log('Adding new page');
      Backbone.history.navigate('/page/new/' + this.model.get('_id'), {trigger: true});
    },


    loadPage: function(event) {
      event.preventDefault();
      var pageModel = new PageModel({_id:$(event.currentTarget).data('page-id')});
      pageModel.fetch();
      this.$('.editor').html(new PageView({model: pageModel}).$el);
    }*/

  }, {
    template: 'editor'
  });

  return EditorView;

});
