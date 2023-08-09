// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function (require) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var PasswordHelpers = require('plugins/passwordChange/passwordHelpers');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var PasswordFieldsView = OriginView.extend({
    tagName: 'div',
    className: 'password-fields-view',

    events: {
      'keyup #password': 'onPasswordKeyup',
      'keyup #passwordText': this.onPasswordTextKeyup,
      'click .toggle-password': 'togglePasswordView'
    },

    preRender: function () {
      this.listenTo(this.model, 'invalid', this.handleValidationError);
      this.listenTo(this.model, 'onPasswordKeyup', this.onPasswordKeyup);
    },

    postRender: function () {
      this.setViewToReady();
    },

    handleValidationError: function (model, error) {
      Origin.trigger('sidebar:resetButtons');

      if (error && _.keys(error).length !== 0) {
        _.each(error, function (value, key) {
          this.$('#' + key + 'Error').html(value);
        }, this);
        this.$('.error-text').removeClass('display-none');
      }
    },

    togglePassword: function (event) {
      event && event.preventDefault();
      // convert to bool and invert
      this.model.set('_isNewPassword', !!!this.model.get('_isNewPassword'));
    },

    togglePasswordView: function () {
      event && event.preventDefault();

      this.$('#passwordText').toggleClass('display-none');
      this.$('#password').toggleClass('display-none');
      this.$('.toggle-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
    },

    indicatePasswordStrength: function (event) {
      var password = $('#password').val();
      var $passwordStrength = $('#passwordFeedback');

      $passwordStrength.removeClass().html(PasswordHelpers.getPasswordView(password));
    },

    onPasswordKeyup: function () {
      console.log('on password keyup');
      if (this.$('#password').val().length > 0) {
        this.$('#passwordText').val(this.$('#password').val());
        this.$('.toggle-password').removeClass('display-none');
      } else {
        this.$('.toggle-password').addClass('display-none');
      }
      this.indicatePasswordStrength();
    },

    onPasswordTextKeyup: function () {
      console.log('on password textkeyup');
    }
  }, {
    template: 'passwordFields'
  });

  return PasswordFieldsView;
});
