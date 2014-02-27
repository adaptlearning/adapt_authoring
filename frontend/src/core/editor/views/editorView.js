define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var PageView = require('coreJS/editor/views/pageView');
  var PageCollection = require('coreJS/editor/collections/pageCollection');
  var PageModel = require('coreJS/editor/models/pageModel');
  
  var EditorView = BuilderView.extend({

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link" : "addNewPage",
      "click a.load-page"     : "loadPage",
    },

    addNewPage: function(event) {
      event.preventDefault();

      console.log('Adding new page');
      Backbone.history.navigate('/page/new/' + this.model.get('_id'), {trigger: true});
    },

    preRender: function() {
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      this.listenTo(this.model, 'sync', this.renderPageView);
    },

    renderPageView: function() {
      var pageCollection = this.model.pageCollection;

      if (pageCollection.length != 0) {
        var list = $('<ul/>').appendTo('.editor-page-list');

        _.each(pageCollection.models, function(model) {
          list.append('<li><a class="load-page" data-page-id="' + model.get('_id') + '" href="#">' + model.get('name') + '</a></li>');
        }, this);
    
        console.log(this.model.pageCollection);
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
