// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
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
      var self = this;
      this.get('user').on('change:firstName change:lastName change:email', function(model) {
        var user = _.findWhere(self.get('users'), { _id: model.get('_id') });
        user && _.extend(user, model.changedAttributes());
      });
      this.get('user').fetch();
    },

    logout: function () {
      $.post('/api/logout', function() {
        self.set(defaults);
        Origin.trigger('login:changed');
        Origin.router.navigate('#/user/login', { trigger: true });
      });
    },

    login: function (username, password, shouldPersist) {
      var self = this;
      $.ajax({
        method: 'post',
        url: '/api/login',
        data: { email:username, password:password, shouldPersist:shouldPersist },
        success: function (jqXHR, textStatus, errorThrown) {
          if (jqXHR.success) {
            self.set({
              id: jqXHR.id,
              tenantId: jqXHR.tenantId,
              email: jqXHR.email,
              isAuthenticated: jqXHR.success,
              permissions: jqXHR.permissions,
              users: jqXHR.users
            });
            Origin.trigger('login:changed');
            Origin.trigger('schemas:loadData', function() {
              Origin.router.navigate('#/dashboard', { trigger: true });
            });
          }
        },
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
