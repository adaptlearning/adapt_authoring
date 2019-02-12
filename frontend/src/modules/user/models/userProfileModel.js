// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'backbone',
  'core/origin',
  'core/helpers'
], function(Backbone, Origin, Helpers) {
  var UserProfileModel = Backbone.Model.extend({

    idAttribute: '_id',
    url: '/api/user/me',

    validate: function (attributes, options) {
      var validationErrors = {};

      if (!attributes.firstName) {
        validationErrors.firstName = Origin.l10n.t('app.validationrequired');
      }

      if (!attributes.lastName) {
        validationErrors.lastName = Origin.l10n.t('app.validationrequired');
      }

      if (attributes._isNewPassword) {
        if (!attributes.password) {
          validationErrors.password = Origin.l10n.t('app.validationrequired');
        } else {
          validationErrors.password = Helpers.validatePassword(attributes.password).join('<br>');
        }
      }

      return _.isEmpty(validationErrors) ? null : validationErrors;
    }

  });

  return UserProfileModel;

});
