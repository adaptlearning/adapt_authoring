// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var UserModel = require('./userModel');

  // TODO link to file once user mangagement is merged
  var UserCollection = Backbone.Collection.extend({
    url: '/api/user'
  });

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
      user: null
    },

    events: {
      'change:users': this.setCurrentUser
    },

    initialize: function() {
      this.set('users', new UserCollection());
      Origin.on('origin:initialize login:changed', _.bind(function() {
        this.get('users').fetch({
          success: _.bind(function(collection) {
            this.set('users', collection);
            this.setCurrentUser();
          }, this)
        });
      }, this));
    },

    setCurrentUser: function() {
      if(this.get('user') && this.get('user').get('_id') === this.get('id')) {
        this.get('user').fetch({
          success: function() { Origin.trigger('user:updated'); }
        });
      } else {
        if(this.get('users').length === 0) return; // not ready
        var user = this.get('users').findWhere({ _id: this.get('id') });
        this.set('user', user);
        Origin.trigger('user:updated');
      }
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
              permissions: jqXHR.permissions
            });

            this.get('users').fetch();

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
