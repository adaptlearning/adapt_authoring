define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var PageView = require('coreJS/editor/views/pageView');
  var PageCollection = require('coreJS/editor/collections/pageCollection');
  
  var EditorView = BuilderView.extend({

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link" : "addNewPage" 
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
      var pageCollection = this.model.pages();

      if (pageCollection.length != 0) {
        var list = $('<ul/>').appendTo('.editor-page-list');

        _.each(pageCollection.models, function(model) {
          list.append('<li>' + model.get('name') + '</li>');
        }, this);
      }

      console.log(pageCollection);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
