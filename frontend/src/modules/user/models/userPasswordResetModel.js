// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var PasswordHelpers = require('plugins/passwordChange/passwordHelpers');

  var UserPasswordResetModel = Backbone.Model.extend({

    defaults: {
      password: '',
      confirmPassword: ''
    },

    initialize : function(options) {},

    url: function () {
      return "api/userpasswordreset/" + this.get('token');
    },

    validate: function (attributes, options) {
      var validationErrors = {};

      if (!attributes.password) {
        validationErrors.password = Origin.l10n.t('app.validationrequired');
      } else {
        if (PasswordHelpers.validatePassword(attributes.password).length > 0 || !attributes.password) {
          validationErrors.password = `${Origin.l10n.t('app.passwordindicatormedium')}`;
        }
        if (!PasswordHelpers.validateConfirmationPassword(attributes.password, attributes.confirmPassword)){
          validationErrors.confirmPassword = `${Origin.l10n.t('app.confirmpasswordnotmatch')}`;
        }
      }

      return _.isEmpty(validationErrors)
        ? null
        : validationErrors;
    }
  });

  return UserPasswordResetModel;

});
