define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');

  var PageView = BuilderView.extend({

    tagName: 'div',

    className: 'page',

    events: {
      'click a.delete-link' : 'deletePage'
    },

    deletePage: function(event) {
      event.preventDefault();
      if (confirm('Are you sure you want to delete this page?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    }
    
  }, {
    template: 'page'
  });

  return PageView;

});