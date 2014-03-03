define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorBlockView = OriginView.extend({

    tagName: 'div',

    className: 'block',

    events: {
      'click a.block-edit'   : 'loadPageEdit',
      'click a.block-delete' : 'deleteBlock'
    },

    deleteBlock: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this block?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebar:addEditView', this.model);
    }

  }, {
    template: 'editorBlock'
  });

  return EditorBlockView;

});
