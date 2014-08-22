define(function(require) {

  var Origin = require('coreJS/app/origin');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var DashboardSidebarView = require('coreJS/dashboard/views/dashboardSidebarView');
  var ProjectCollection = require('coreJS/project/collections/projectCollection');

  Origin.on('router:dashboard', function(location, subLocation, action) {

    Origin.editor = {};
    Origin.editor.data = {};
    
    if (!location) {
      var projects = new ProjectCollection();
      projects.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Dashboard - viewing all courses'});
          Origin.router.createView(DashboardView, {collection:projects});
          Origin.sidebar.addView(new DashboardSidebarView({collection:projects}).$el);
        }
      });
      
    }

    

  });

  Origin.on('globalMenu:dashboard:open', function() {

    Origin.router.navigate('#/dashboard', {trigger: true});

  });

  var globalMenuObject = {
    "location": "global",
    "text": "Dashboard",
    "icon": "dashboard",
    "callbackEvent": "dashboard:open"
  };

  Origin.once('app:dataReady', function() {
    Origin.globalMenu.addItem(globalMenuObject);
  });

});