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
      
    },

    preRender: function() {
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      this.listenTo(this.model, 'sync', this.renderPageView);
    },

    renderPageView: function() {
      this.$('.editor').empty();
      this.$('.editor').append(new PageView({model: this.model}).$el);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
