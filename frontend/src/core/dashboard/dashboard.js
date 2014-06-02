define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');

  Origin.on('router:dashboard', function(location, subLocation, action) {
    console.log('routing');
    Origin.editor = {};
    Origin.editor.data = {};
    if (!location) {
      console.log('new dashboard view created');
      Origin.router.createView(DashboardView);
    }

  });

});