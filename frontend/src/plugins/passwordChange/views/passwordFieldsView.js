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
      'keyup #confirmPassword': 'onConfirmPasswordKeyup',
      'keyup #passwordText': 'onPasswordTextKeyup',
      'keyup #confirmPasswordText': 'onConfirmPasswordTextKeyup',
      'click .toggle-password': 'togglePasswordView',
      'click .toggle-confirmation-password': 'toggleConfirmationPasswordView'
    },

    preRender: function () {
      this.listenTo(this.model, 'invalid', this.handleValidationError);
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

    toggleConfirmationPasswordView: function () {
      event && event.preventDefault();

      this.$('#confirmPasswordText').toggleClass('display-none');
      this.$('#confirmPassword').toggleClass('display-none');
      this.$('.toggle-toggle-confirmation-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
    },

    indicatePasswordStrength: function (event) {
      var password = $('#password').val();
      var errors = PasswordHelpers.validatePassword(password);
      var $passwordSpecialChar = $('.password-special-char-feedback');
      var $passwordNumber = $('.password-number-feedback');
      var $passwordUppercase = $('.password-uppercase-feedback');
      var $passwordLength = $('.password-length-feedback');

      var xMark = '&#10008;';
      var checkMark = '&#10003;';

      errors.includes('missingspecialchars') ? $passwordSpecialChar.attr('aria-checked', false).html(xMark) : $passwordSpecialChar.attr('aria-checked', true).html(checkMark);
      errors.includes('missingnumber') ? $passwordNumber.attr('aria-checked', false).html(xMark) : $passwordNumber.attr('aria-checked', true).html(checkMark);
      errors.includes('missinguppercase') ? $passwordUppercase.attr('aria-checked', false).html(xMark) : $passwordUppercase.attr('aria-checked', true).html(checkMark);
      errors.includes('tooshort') ? $passwordLength.attr('aria-checked', false).html(xMark) : $passwordLength.attr('aria-checked', true).html(checkMark);
      
    },

    onConfirmPasswordKeyup: function () {
      if (this.$('#confirmPassword').val().length > 0) {
        this.$('#confirmPasswordText').val(this.$('#confirmPassword').val());
        this.$('.toggle-confirmation-password').removeClass('display-none');
      } else {
        this.$('.toggle-confirmation-password').addClass('display-none');
      }
    },

    onPasswordKeyup: function () {
      if (this.$('#password').val().length > 0) {
        this.$('#passwordText').val(this.$('#password').val());
        this.$('.toggle-password').removeClass('display-none');
      } else {
        this.$('.toggle-password').addClass('display-none');
      }
      this.indicatePasswordStrength();
    },

    onPasswordTextKeyup: function () {
      this.$('#password').val(this.$('#passwordText').val());
      this.indicatePasswordStrength();
    },

    onConfirmPasswordTextKeyup: function () {
      this.$('#confirmPassword').val(this.$('#confirmPasswordText').val());
    }
  }, {
    template: 'passwordFields'
  });

  return PasswordFieldsView;
});
