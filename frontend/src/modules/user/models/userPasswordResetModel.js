// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'backbone',
  'core/origin',
  'core/helpers'
], function(Backbone, Origin, Helpers) {

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
      var errors = [];

      if (!attributes.password) {
        errors.push(Origin.l10n.t('app.validationrequired'));
      } else {
        var pwErrors = Helpers.validatePassword(attributes.password);
        errors = errors.concat(pwErrors);
      }

      if (!attributes.confirmPassword) {
        errors.push(Origin.l10n.t('app.validationrequired'));
      } else {
        if (attributes.password !== attributes.confirmPassword) {
          errors.push(Origin.l10n.t('app.validationpasswordmatch'));
        }
      }

      if (errors.length) return errors;
      return null;
    }
  });

  return UserPasswordResetModel;

});
