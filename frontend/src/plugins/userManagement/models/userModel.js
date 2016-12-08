// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var UserModel = Backbone.Model.extend({
    idAttribute: '_id',

    initialize: function() {
      this.on('change:globalData', this.onGlobalDataChanged);
      this.on('change:roles', this.setRoleNames);
      this.on('change:_tenantId', this.setTenantName);
      this.on('change:failedLoginCount', this.setLockStatus);

      this.setLockStatus();
    },

    onGlobalDataChanged: function(model, value, options) {
      this.setRoleNames(model, model.get('roles'), options);
      this.setTenantName(model, model.get('_tenantId'), options);
    },

    // pull the human-readable role names from the list of all roles
    setRoleNames: function(model, value, options) {
      var roleNames;
      if(typeof value === 'object') { // array
        roleNames = value.map(function(role, index) {
          var id = role._id || role;
          return model.get('globalData').allRoles.findWhere({ _id:id }).get('name');
        });
      } else { // string
        roleNames = model.get('globalData').allRoles.findWhere({ _id:value }).get('name');
      }
      model.set('roleNames', roleNames);
    },

    // pull the human-readable tenant name from the list of all tenants
    setTenantName: function(model, value, options) {
      var tenantId = model.get('_tenantId');
      if(!tenantId) {
        return;
      }
      var tenantName;
      if(typeof tenantId === 'object') {
        tenantName = tenantId.name;
      } else { // string
        tenantName =  model.get('globalData').allTenants.findWhere({ _id:tenantId }).get('name');
      }
      model.set('tenantName', tenantName);
    },

    setLockStatus: function(model, value, options) {
      // HACK MAX_LOGIN_ATTEMPTS doesn't seem to be set anywhere other than plugins/auth/local:line-30
      var MAX_LOGIN_ATTEMPTS = 3;
      var newLocked = this.get('failedLoginCount') >= MAX_LOGIN_ATTEMPTS;
      if(newLocked !== this.get('_isLocked')) {
        this.set('_isLocked', newLocked);
      }
    }
  });

  return UserModel;
});
