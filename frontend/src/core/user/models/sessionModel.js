// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var UserModel = require('./userModel');

  // TODO link to file once user mangagement is merged
  var UserCollection = Backbone.Collection.extend({ url: '/api/user' });

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

    fetch: function(options) {
      var self = this;
      // hijack success callback
      options = options || {};
      var successCb = options.success;
      options.success = function() {
        // keep existing 'this' scope
        if(successCb) successCb.call(this);

        if(!self.get('user') && self.get('id')) {
          self.set('user', new UserModel({ _id: self.get('id') }));
        }
        if(self.get('user')) {
          self.get('user').fetch({
            success: function() {
              Origin.trigger('user:updated');
              // get users
              if(Origin.permissions.hasPermissions(self.get('permissions'))){
                var users = new UserCollection();
                users.fetch({
                  success: _.bind(function(collection) {
                    self.set('users', users);
                    Origin.trigger('sessionModel:initialised');
                  }, this)
                });
              } else {
                Origin.trigger('sessionModel:initialised');
              }
            }
          });
        } else {
          Origin.trigger('sessionModel:initialised');
        }
      };

      Backbone.Model.prototype.fetch.call(this, options);
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
          this.fetch({
            success: _.bind(function() {
              if (jqXHR.success) {
                this.set({
                  id: jqXHR.id,
                  tenantId: jqXHR.tenantId,
                  email: jqXHR.email,
                  isAuthenticated: jqXHR.success,
                  permissions: jqXHR.permissions
                });
                Origin.trigger('login:changed');
                Origin.trigger('schemas:loadData', function() {
                  Origin.router.navigate('#/dashboard', { trigger: true });
                });
              }
            }, this)
          });
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
