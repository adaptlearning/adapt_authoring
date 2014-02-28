define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var SidebarPageEditView = OriginView.extend({

  
    tagName: "div",

    className: "project"

  },
  {
    template: 'sidebarPageEdit'
  });

  return SidebarPageEditView;

});
