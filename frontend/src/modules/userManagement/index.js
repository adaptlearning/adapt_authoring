// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var UserManagementView = require('./views/userManagementView');
  var AddUserView = require('./views/addUserView');
  var CustomHelpers = require('./helpers');

  var isReady = false;
  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"],
    allRoles: new Backbone.Collection(),
    allTenants: new Backbone.Collection()
  };

  Origin.on('origin:dataReady login:changed', function() {
    Origin.permissions.addRoute('userManagement', data.featurePermissions);

  	if (!Origin.permissions.hasPermissions(data.featurePermissions)) {
      return isReady = true;
    }
    data.allRoles.on('sync', onDataFetched);
    data.allRoles.url = 'api/role';
    data.allRoles.fetch();

    data.allTenants.on('sync', onDataFetched);
    data.allTenants.url = 'api/tenant';
    data.allTenants.fetch();

		Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.usermanagement'),
      "icon": "fa-users",
      "sortOrder": 3,
      "callbackEvent": "userManagement:open"
    });
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

  var onRoute = function(location, subLocation, action) {
    var viewOptions = { model: new Backbone.Model({ globalData: data }) };

    if('addUser' === location) loadAddUserView(viewOptions);
    else loadUserManagementView(viewOptions);
  };

  function onDataFetched() {
    // ASSUMPTION we always have roles and tenants
    if(data.allRoles.length > 0 && data.allTenants.length > 0) {
      isReady = true;
      Origin.trigger('userManagement:dataReady');
    }
  }

  function loadAddUserView(options) {
    Origin.contentPane.setView(AddUserView, options);
    Origin.sidebar.update({
      actions: [
        { name: 'save', type: 'primary', labels: { default: 'app.save' } },
        { name: 'cancel', type: 'secondary', label: 'app.cancel' },
      ]
    });
  }

  function loadUserManagementView(options) {
    Origin.contentPane.setView(UserManagementView, options);
    Origin.sidebar.update({
      actions: [
        { name: 'add', type: 'primary', label: 'app.addnewuser' },
      ]
    });
  }
});
