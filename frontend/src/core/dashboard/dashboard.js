define(function(require) {

  var Origin = require('coreJS/app/origin');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');

  Origin.on('router:dashboard', function(location, subLocation, action) {

    Origin.editor = {};
    Origin.editor.data = {};
    if (!location) {
      Origin.router.createView(DashboardView);
    }

  });

});