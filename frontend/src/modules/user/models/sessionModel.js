// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'backbone', 'core/origin'], function(require, Backbone, Origin) {
  var SessionModel = Backbone.Model.extend({
    url: "/api/authcheck",
    defaults: {
      id: '',
      tenantId: '',
      email: '',
      isAuthenticated: false,
      permissions: [],
      otherLoginLinks: []
    },

    initialize: function() {
    },

    login: function (username, password, shouldPersist) {
      var postData = {
        email: username,
        password: password,
        shouldPersist: shouldPersist
      };
      $.post('/api/login', postData, _.bind(function (jqXHR, textStatus, errorThrown) {
        this.set({
          id: jqXHR.id,
          tenantId: jqXHR.tenantId,
          email: jqXHR.email,
          isAuthenticated: true,
          permissions: jqXHR.permissions
        });
        Origin.trigger('login:changed');
        Origin.trigger('schemas:loadData', Origin.router.navigateToHome);
      }, this)).fail(function(jqXHR, textStatus, errorThrown) {
        Origin.trigger('login:failed', (jqXHR.responseJSON && jqXHR.responseJSON.errorCode) || 1);
      });
    },

    logout: function () {
      $.post('/api/logout', _.bind(function() {
        // revert to the defaults
        this.set(this.defaults);
        Origin.trigger('login:changed');
        Origin.router.navigateToLogin();
      }, this));
    },
  });

  return SessionModel;
});
