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
      this.collection = new PageCollection({projectid:this.model.get('_id')});
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      this.listenTo(this.collection, 'sync', this.renderPageViews);
    },

    renderPageViews: function() {
      this.$('.editor').empty();

      _.each(this.collection.models, function(page) {
        this.$('.editor').append(new PageView({model: page}).$el);
      }, this);
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
