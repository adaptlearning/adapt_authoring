define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');

  var PageView = BuilderView.extend({

    tagName: 'div',

    className: 'page col-6 col-sm-4 col-lg-2',

    events: {
      'click div.projectDetail' : 'viewPage',
      'click a.delete-link' : 'deletePage'
    },

    viewPage: function(event) {
      event.preventDefault();
      Backbone.history.navigate('#page/view/'+this.model.get('_id'), {trigger: true});
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