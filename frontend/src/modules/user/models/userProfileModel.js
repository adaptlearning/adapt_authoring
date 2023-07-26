// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var _ = require('underscore');

  var UserProfileModel = Backbone.Model.extend({

    idAttribute: '_id',
    url: 'api/user/me',

    validate: function (attributes, options) {
      var validationErrors = {};

      if (!attributes.firstName) {
        validationErrors.firstName = Origin.l10n.t('app.validationrequired');
      }

      if (!attributes.lastName) {
        validationErrors.lastName = Origin.l10n.t('app.validationrequired');
      }

      if (!attributes.email) {
        validationErrors.email = Origin.l10n.t('app.validationrequired');
      } else if (!Helpers.isValidEmail(attributes.email)) {
        validationErrors.email = Origin.l10n.t('app.invalidusernameoremail');
      }

      if (attributes._isNewPassword) {
        if (!attributes.password) {
          validationErrors.password = Origin.l10n.t('app.validationrequired');
        } else {
          var errors = Helpers.getPasswordErrors(attributes.password);
          var htmlText = '';
          _.each(errors, function (err) {
            htmlText += `<li>${err}</li>`;
          });
          validationErrors.password = `<span class="alert alert-error">${htmlText}</span>`;
        }

        if (!attributes.confirmPassword) {
          validationErrors.confirmPassword = `<span class="alert alert-error">${Origin.l10n.t('app.validationrequired')}</span>`;
        } else if (attributes.confirmPassword !== attributes.password) {
          validationErrors.confirmPassword = `<span class="alert alert-error">${Origin.l10n.t('app.confirmpasswordnotmatch')}</span>`;
        }
      }

      return _.isEmpty(validationErrors) 
      ? null
      : validationErrors;
    }

  });

  return UserProfileModel;

});