define(function(require){

  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  
  var EditorView = BuilderView.extend({

    tagName: "div",

    className: "editor-menu",

    preRender: function() {
/*      this.listenTo(this.model, 'sync', this.render);
      this.model.fetch();*/
    }

  }, {
    template: 'editor-menu'
  });

  return EditorView;

});
