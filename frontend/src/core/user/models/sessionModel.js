// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var UserModel = require('./userModel');

  var SessionModel = Backbone.Model.extend({
    url: "/api/authcheck",
    defaults: {
      isAuthenticated: false,
      id: '',
      tenantId: '',
      email: '',
      otherLoginLinks: [],
      permissions: [],
      _canRevert: false,
      user: new UserModel(),
      users: []
    },

    initialize: function() {
      Origin.on('app:dataReady login:changed user:updated', _.bind(function() {
        if(this.get('user')) this.get('user').fetch();
      }, this));
    },

    logout: function () {
      $.post('/api/logout', _.bind(function() {
        this.set(this.defaults);
        Origin.trigger('login:changed');
        Origin.router.navigate('#/user/login', { trigger: true });
      }, this));
    },

    login: function (username, password, shouldPersist) {
      $.ajax({
        method: 'post',
        url: '/api/login',
        data: { email:username, password:password, shouldPersist:shouldPersist },
        success: _.bind(function (jqXHR, textStatus, errorThrown) {
          if (jqXHR.success) {
            this.set({
              id: jqXHR.id,
              tenantId: jqXHR.tenantId,
              email: jqXHR.email,
              isAuthenticated: jqXHR.success,
              permissions: jqXHR.permissions,
              users: jqXHR.users
            });
            this.get('user').set('_id', jqXHR.id);
            Origin.trigger('login:changed');
            Origin.trigger('schemas:loadData', function() {
              Origin.router.navigate('#/dashboard', { trigger: true });
            });
          }
        },this),
        error: function (jqXHR, textStatus, errorThrown) {
          var errorCode = 1;
          if (jqXHR.responseJSON && jqXHR.responseJSON.errorCode) {
            errorCode = jqXHR.responseJSON.errorCode;
          }
          Origin.trigger('login:failed', errorCode);
        }
      });
    }
  });

  return SessionModel;
});
