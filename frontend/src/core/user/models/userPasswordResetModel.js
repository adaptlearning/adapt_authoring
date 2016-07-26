// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var UserPasswordResetModel = Backbone.Model.extend({

    defaults: {
      password: '',
      confirmPassword: ''
    },

    initialize : function(options) {},

    url: function () {
      return "/api/userpasswordreset/" + this.get('token');
    },

    validate: function (attributes, options) {
      var validationErrors = {};

      if (!attributes.password) {
        validationErrors.password = window.polyglot.t('app.validationrequired');
      } else {
        if (attributes.password.length < 8) {
          validationErrors.password = window.polyglot.t('app.validationlength', {length: 8});
        }
      }

      if (!attributes.confirmPassword) {
        validationErrors.confirmPassword = window.polyglot.t('app.validationrequired');
      } else {
        if (attributes.password !== attributes.confirmPassword) {
          validationErrors.confirmPassword = window.polyglot.t('app.validationpasswordmatch');
        }
      }

      return _.isEmpty(validationErrors)
        ? null
        : validationErrors;
    },

    resetPassword: function () {
      var self = this;

      $.ajax({
        method: 'post',
        url: '/api/userpasswordreset',
        data: {
          user: self.get('user'),
          // password: password,
          token: self.get('token')
        },
        success: function (jqXHR, textStatus, errorThrown) {
          if (jqXHR.success) {
            Origin.router.navigate('#/dashboard', {trigger: true});
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorgeneric')
          });
        }
      });
    }
  });

  return UserPasswordResetModel;

});
