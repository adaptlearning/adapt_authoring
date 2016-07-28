// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var _ = require('underscore');

  var UserProfileModel = Backbone.Model.extend({

    idAttribute: '_id',
    url: '/api/user/me',

    validate: function (attributes, options) {
      var validationErrors = {};

      if (!attributes.firstName) {
        validationErrors.firstName = window.polyglot.t('app.validationrequired');
      }

      if (!attributes.lastName) {
        validationErrors.lastName = window.polyglot.t('app.validationrequired');
      }

      if (attributes._isNewPassword) {
        if (!attributes.password) {
          validationErrors.password = window.polyglot.t('app.validationrequired');
        } else {
          if (attributes.password.length < 8) {
            validationErrors.password = window.polyglot.t('app.validationlength', {length: 8});
          }
        }
      }

      return _.isEmpty(validationErrors) 
      ? null
      : validationErrors;
    }

  });

  return UserProfileModel;

});