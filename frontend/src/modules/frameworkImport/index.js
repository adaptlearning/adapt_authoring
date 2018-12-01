// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');

  Origin.on('origin:dataReady login:changed', function() {
    Origin.permissions.addRoute('frameworkImport', ["*/*:create","*/*:read","*/*:update","*/*:delete"]);
  });

  Origin.on('router:frameworkImport', function(location, subLocation, action) {
    Origin.contentPane.setView(FrameworkImportView, { model: new Backbone.Model() });
    Origin.sidebar.update({
      actions: [
        { name: 'import', type: 'primary', labels: { default: 'app.importcourse' } },
        { name: 'cancel', type: 'secondary', labels: { default: 'app.cancel' } },
      ]
    });
  });
});
