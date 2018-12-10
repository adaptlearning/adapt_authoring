// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var UserModel = require('../models/userModel');
  var Moment = require('moment');

  var UserCollection = Backbone.Collection.extend({
    model: UserModel,

    sortBy: 'email',
    direction: 1,
    mailSearchTerm: false,

    filterGroups: {},

    lastAccess: null,

    initialize: function() {
      this.listenTo(this, 'sync', this.onSync);
    },

    comparator: function(ma, mb) {
      var a = ma.get(this.sortBy);
      var b = mb.get(this.sortBy);

      if (Array.isArray(a) && Array.isArray(b)) {
        a = a[0];
        b = b[0];
      }

      if (this.sortBy === 'lastAccess') {
        a = new Date(a || '01.01.1900');
        b = new Date(b || '01.01.1900');
      }

      if (typeof a === 'string' && typeof b === 'string') {
        a = a.toLowerCase();
        b = b.toLowerCase();
      }

      if (a > b) return this.direction;
      else if (a < b) return this.direction*-1;
      return 0;
    },

    url: 'api/user',

    updateFilter: function(filterMap) {
      this.filterGroups = filterMap;
      this.sortCollection();
    },

    sortCollection: function() {
      this.resetHidden();
      this.filter();
      this.searchByMail();
      this.sort();
    },

    filter: function() {
      this.models.forEach(function(model) {
        this.filterFailedLoginCount(model);
        this.filterTenants(model);
        this.filterRoleNames(model);
        this.filterLastAccess(model);
      }, this);
    },

    filterFailedLoginCount: function(model) {
      if (this.filterGroups.failedLoginCount
        && this.filterGroups.failedLoginCount.indexOf(model.get('failedLoginCount').toString()) < 0) {
        model.set('_isHidden', true);
      }
    },

    filterTenants: function(model) {
      if (this.filterGroups.tenantName
        && this.filterGroups.tenantName.indexOf(model.get('tenantName')) < 0) {
        model.set('_isHidden', true);
      }
    },

    filterRoleNames: function(model) {
      if (this.filterGroups.roleNames
        && this.filterGroups.roleNames.indexOf(model.get('roleNames')[0]) < 0) {
        model.set('_isHidden', true);
      }
    },

    filterLastAccess: function(model) {
      var lastAccess = model.get('lastAccess');
      if (this.filterGroups.lastAccess && this.filterGroups.lastAccess[0] === 'never') {
        if (lastAccess) {
          model.set('_isHidden', true);
        }
        return;
      }
      if (this.filterGroups.startDate && this.filterGroups.endDate) {
        if (!lastAccess) return model.set('_isHidden', true);
        var lastAccessDate = new Date(lastAccess);
        if (lastAccessDate < this.filterGroups.startDate || lastAccessDate > this.filterGroups.endDate) {
          model.set('_isHidden', true);
        }
      }
    },

    onSync: function() {
      ['roleNames','tenantName','failedLoginCount'].forEach(function(key) {
        this.filterGroups[key] = this.getGroups(key);
      }, this);
    },

    resetHidden: function() {
      this.forEach(function(model) {
        model.set('_isHidden', false);
      });
    },

    getGroups: function(type) {
      return Object.keys(this.groupBy(type));
    },

    searchByMail: function() {
      if (!this.mailSearchTerm) return;
      this.models.forEach(function(model) {
        var mail = model.get('email').toLowerCase();
        if (mail.indexOf(this.mailSearchTerm) < 0) {
          model.set('_isHidden', true);
        }
      }, this);
    }

  });

  return UserCollection;
});
