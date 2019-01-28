// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');
  var FrameworkImportSidebarView = require('./views/frameworkImportSidebarView.js');

  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"]
  };

  Origin.on('origin:dataReady login:changed', function() {
    Origin.permissions.addRoute('frameworkImport', data.featurePermissions);
  });

  Origin.on('router:frameworkImport', function(location, subLocation, action) {
    Origin.contentPane.setView(FrameworkImportView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new FrameworkImportSidebarView().$el);
  });
});
