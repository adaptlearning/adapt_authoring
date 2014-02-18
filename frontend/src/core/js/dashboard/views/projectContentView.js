//@TODO course|project
define(function(require){

  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');

  var ProjectContentView = BuilderView.extend({

    tagName: "div",

    className: "project col-6 col-sm-4 col-lg-2",

    attributes: function () {
      return {
        'data-contentid': this.model.get('_id'),
        'data-type': this.model.get('type')
      };
    }

  }, {
    template: 'projectContent'
  });

  return ProjectContentView;

});
