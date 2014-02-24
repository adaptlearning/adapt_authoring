define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/adaptBuilder');
  var BuilderView = require('coreJS/core/views/builderView');
  
  var EditorView = BuilderView.extend({

    tagName: "div",

    className: "editor-view",

    preRender: function() {
      //this.collection = new ProjectCollection();
      //this.collection.fetch();

      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      //this.listenTo(this.collection, 'sync', this.addProjectViews);
      //this.listenTo(this.collection, 'remove', this.projectRemoved);
    },

    events: {
      
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
