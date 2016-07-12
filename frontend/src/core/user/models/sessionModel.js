// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var SessionModel = Backbone.Model.extend({

    defaults: {
      isAuthenticated: false,
      id: '',
      tenantId: '',
      email: '',
      otherLoginLinks: []
    },

    url: "/api/authcheck",

    initialize: function() {},

    logout: function () {
      var self = this;

      $.post(
        '/api/logout',
        function() {
          self.set('isAuthenticated', false);
          self.set('id', '');
          self.set('tenantId', '');
          self.set('email', '');
          self.set('permissions', []);
          self.set('_canRevert', false);

          Origin.trigger('login:changed');
          Origin.router.navigate('#/user/login', {trigger: true});
      });
    },

    login: function (username, password, shouldPersist) {
      var self = this;

      $.ajax({
        method: 'post',
        url: '/api/login',
        data: {email: username, password: password, shouldPersist: shouldPersist},
        success: function (jqXHR, textStatus, errorThrown) {
          if (jqXHR.success) {
            self.set('id', jqXHR.id);
            self.set('tenantId', jqXHR.tenantId);
            self.set('email', jqXHR.email);  
            self.set('isAuthenticated', jqXHR.success);
            self.set('permissions', jqXHR.permissions);

            Origin.trigger('login:changed');

            Origin.trigger('schemas:loadData', function() {
              Origin.router.navigate('#/dashboard', {trigger: true});
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