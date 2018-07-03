// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

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
        validationErrors.password = Origin.l10n.t('app.validationrequired');
      } else {
        if (attributes.password.length < 8) {
          validationErrors.password = Origin.l10n.t('app.validationlength', {length: 8});
        }
      }

      if (!attributes.confirmPassword) {
        validationErrors.confirmPassword = Origin.l10n.t('app.validationrequired');
      } else {
        if (attributes.password !== attributes.confirmPassword) {
          validationErrors.confirmPassword = Origin.l10n.t('app.validationpasswordmatch');
        }
      }

      return _.isEmpty(validationErrors)
        ? null
        : validationErrors;
    }
  });

  return UserPasswordResetModel;

});
