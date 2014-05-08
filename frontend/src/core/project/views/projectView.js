define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ProjectView = OriginView.extend({

    tagName: 'li',

    className: 'project',

    events: {
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
    }
    
  }, {
    template: 'project'
  });

  return ProjectView;

});