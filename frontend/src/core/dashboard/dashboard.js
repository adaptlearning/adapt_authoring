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
          Origin.options.addItems([
            {
              title: 'View as grid',
              icon: 'th',
              callbackEvent: 'dashboard:layout:grid',
              group:'views'
            }, {
              title: 'View as list',
              icon: 'list',
              callbackEvent: 'dashboard:layout:list',
              group:'views'
            },
            {
              title: 'Sort ascending',
              icon: 'th',
              callbackEvent: 'dashboard:sort:asc',
              group:'sort'
            }, {
              title: 'Sort descending',
              icon: 'list',
              callbackEvent: 'dashboard:sort:desc',
              group:'sort'
            }
          ]);
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
    "icon": "fa-home",
    "callbackEvent": "dashboard:open",
    "sortOrder": 1
  };

  Origin.once('app:dataReady', function() {
    Origin.globalMenu.addItem(globalMenuObject);
  });

});