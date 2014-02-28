define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');
  var BuilderView = require('coreJS/app/views/builderView');

  var SidebarPageEditView = BuilderView.extend({

  
    tagName: "div",

    className: "project"

  },
  {
    template: 'sidebarPageEdit'
  });

  return SidebarPageEditView;

});
