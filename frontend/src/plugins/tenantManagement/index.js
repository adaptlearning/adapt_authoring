define(function(require) {
  var Origin = require('coreJS/app/origin');
  var TenantManagementView = require('./views/tenantManagementView.js');
  var TenantManagementSidebarView = require('./views/tenantManagementSidebarView.js');
  var AddTenantView = require('./views/addTenantView.js');
  var AddTenantSidebarView = require('./views/addTenantSidebarView.js');

  var isReady = true;
  var data = {
    featurePermissions: ["*/*:create", "*/*:read", "*/*:update", "*/*:delete"],
    allRoles: new Backbone.Collection(),
    allTenants: new Backbone.Collection()
  };

  Origin.on('app:dataReady login:changed', function() {
    if (Origin.permissions.hasPermissions(data.featurePermissions)) {
      var globalMenuObject = {
        "location": "global",
        "text": "Tenants",
        "icon": "fa-users",
        "callbackEvent": "tenantManagement:open",
        "sortOrder": 5
      };
      Origin.globalMenu.addItem(globalMenuObject);
      Origin.globalTopMenu.addItem(globalMenuObject);
    }
  });

  Origin.on('globalMenu:tenantManagement:open', function() {
    Origin.router.navigate('#/tenantManagement', { trigger: true });
  });

  Origin.on('router:tenantManagement', function(location, subLocation, action) {
    // unauthorised users can turn back around
    if (!Origin.permissions.hasPermissions(data.featurePermissions)) {
      Origin.Notify.alert({
        type: 'warning',
        title: window.polyglot.t('app.notauthorisedtitle'),
        text: window.polyglot.t('app.notauthorisedmessage')
      });
      Origin.router.navigate('#/dashboard');
      return;
    }

    if (isReady) {
      onRoute(location, subLocation, action);
    } else {
      Origin.on('tenantManagement:dataReady', function() {
        onRoute(location, subLocation, action);
      });
    }
  });

  var onRoute = function(location, subLocation, action) {
    var mainView, sidebarView;

    if (!location) {
      mainView = TenantManagementView;
      sidebarView = TenantManagementSidebarView;
    } else if ('addTenant' === location) {
      mainView = AddTenantView;
      sidebarView = AddTenantSidebarView;
    }

    Origin.router.createView(mainView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new sidebarView().$el);
  };

  Origin.trigger('tenantManagement:dataReady');
});
