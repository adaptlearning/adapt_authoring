// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var UserManagementView = require('./views/userManagementView');
  var UserManagementSidebarView = require('./views/userManagementSidebarView');
  var AddUserView = require('./views/addUserView');
  var AddUserSidebarView = require('./views/addUserSidebarView');
  var CustomHelpers = require('./helpers');

  var isReady = false;
  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"],
    allRoles: new Backbone.Collection(),
    allTenants: new Backbone.Collection()
  };

  Origin.on('origin:dataReady login:changed', function() {
    Origin.permissions.addRoute('userManagement', data.featurePermissions);
     data.hasSuperAdminPermissions = false;
    data.hasTenantAdminPermissions = false;
    setUserPermission();

  	if (Origin.permissions.hasPermissions(data.featurePermissions)) {

      data.allTenants.on('sync', onDataFetched);
      if (data.hasSuperAdminPermissions) {
        data.allTenants.url = 'api/tenant';
      }else{
        data.allTenants.url = 'api/tenant/'+ Origin.sessionModel.get('tenantId');
      }    
      data.allTenants.fetch();

      data.allRoles.on('sync', onDataFetched);
      data.allRoles.url = 'api/role';
      data.allRoles.fetch();

  		Origin.globalMenu.addItem({
        "location": "global",
        "text": Origin.l10n.t('app.usermanagement'),
        "icon": "fa-users",
        "sortOrder": 3,
        "callbackEvent": "userManagement:open"
      });
  	} else {
      isReady = true;
    }
  });

  Origin.on('globalMenu:userManagement:open', function() {
    Origin.router.navigateTo('userManagement');
  });

  Origin.on('router:userManagement', function(location, subLocation, action) {
    if(isReady) {
      return onRoute(location, subLocation, action);
    }
    Origin.once('userManagement:dataReady', function() {
      onRoute(location, subLocation, action);
    });
  });

   Origin.on('tenantManagement:newtenant', function(tenant) {
    data.allTenants.add(tenant);
  });

  Origin.on('tenantManagement:removetenant', function (tenant) {
    data.allTenants.remove(data.allTenants.findWhere({
      _id: tenant.id
    }));
  });

  var onRoute = function(location, subLocation, action) {
    var mainView, sidebarView;

    if(!location) {
      mainView = UserManagementView;
      sidebarView = UserManagementSidebarView;
    }
    else if('addUser' === location) {
      mainView = AddUserView;
      sidebarView = AddUserSidebarView;
    }

    Origin.contentPane.setView(mainView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new sidebarView().$el);
  };

  var setUserPermission = function(){
    if (Origin.permissions.hasSuperPermissions()) {
      data.hasSuperAdminPermissions = true;
    } else if (Origin.permissions.hasTenantAdminPermission()) {
      data.hasTenantAdminPermissions = true;
    }
  }
  
  var onDataFetched = function() {
    // ASSUMPTION we always have roles and tenants
    if(data.allRoles.length > 0 && data.allTenants.length > 0) {
      isReady = true;
      Origin.trigger('userManagement:dataReady');
    }
  };
});
