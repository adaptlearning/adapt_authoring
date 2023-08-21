// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function (require) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var PasswordHelpers = require('plugins/passwordChange/passwordHelpers');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var PasswordFieldsView = function (opts) {
    var genericId = opts && opts.genericId ? opts.genericId : '';
    var events = {
      'click .toggle-password': 'togglePasswordView',
      'click .toggle-confirmation-password': 'toggleConfirmationPasswordView'
    }
    events[`keyup #password${genericId}`] = 'onPasswordKeyup';
    events[`keyup #confirmPassword${genericId}`] = 'onConfirmPasswordKeyup';
    events[`keyup #passwordText${genericId}`] = 'onPasswordTextKeyup';
    events[`keyup #confirmPasswordText${genericId}`] = 'onConfirmPasswordTextKeyup';

    var view = OriginView.extend({
      tagName: 'div',
      className: 'password-fields-view',
      events: events,

      preRender: function () {
        this.model.set('genericId', genericId);
        this.listenTo(this.model, 'invalid', this.handleValidationError);
      },

      postRender: function () {
        this.setViewToReady();
      },

      handleValidationError: function (model, error) {
        Origin.trigger('sidebar:resetButtons');

        console.log('handle validation error: ', error);
        console.log('handle validation model: ', model);

        if (error && _.keys(error).length !== 0) {
          _.each(error, function (value, key) {
            console.log('key error: ', this.$('#' + key + 'Error' + genericId));
            this.$('#' + key + 'Error' + genericId).html(value);
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

        this.$('#passwordText' + genericId).toggleClass('display-none');
        this.$('#password' + genericId).toggleClass('display-none');
        this.$('.toggle-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
      },

      toggleConfirmationPasswordView: function () {
        event && event.preventDefault();

        this.$('#confirmPasswordText' + genericId).toggleClass('display-none');
        this.$('#confirmPassword' + genericId).toggleClass('display-none');
        this.$('.toggle-confirmation-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
      },

      indicatePasswordStrength: function (event) {
        var password = $('#password' + genericId).val();
        var errors = PasswordHelpers.validatePassword(password);
        var $passwordSpecialChar = $(`.password${genericId}-special-char-feedback`);
        var $passwordNumber = $(`.password${genericId}-number-feedback`);
        var $passwordUppercase = $(`.password${genericId}-uppercase-feedback`);
        var $passwordLength = $(`.password${genericId}-length-feedback`);
        var $passwordChecklistFeedback = $(`.password${genericId}-checklist-feedback`);

        var xMark = '<i class="fa fa-times" aria-hidden="true"></i>';
        var checkMark = '<i class="fa fa-check" aria-hidden="true"></i>';

        errors.includes('missingspecialchars') ? $passwordSpecialChar.html(xMark) : $passwordSpecialChar.html(checkMark);
        errors.includes('missingnumber') ? $passwordNumber.html(xMark) : $passwordNumber.html(checkMark);
        errors.includes('missinguppercase') ? $passwordUppercase.html(xMark) : $passwordUppercase.html(checkMark);
        errors.includes('tooshort') ? $passwordLength.html(xMark) : $passwordLength.html(checkMark);

        $passwordChecklistFeedback.html(`${Origin.l10n.t('app.numberofrequirementscompleted', {number: 4 - errors.length, total: 4}) }`)
        
      },

      onConfirmPasswordKeyup: function () {
        if (this.$('#confirmPassword' + genericId).val().length > 0) {
          this.$('#confirmPasswordText' + genericId).val(this.$('#confirmPassword' + genericId).val());
          this.$('.toggle-confirmation-password').removeClass('display-none');
        } else {
          this.$('.toggle-confirmation-password').addClass('display-none');
        }
      },

      onPasswordKeyup: function () {
        if (this.$('#password' + genericId).val().length > 0) {
          this.$('#passwordText' + genericId).val(this.$('#password' + genericId).val());
          this.$('.toggle-password').removeClass('display-none');
        } else {
          this.$('.toggle-password').addClass('display-none');
        }
        this.indicatePasswordStrength();
      },

      onPasswordTextKeyup: function () {
        this.$('#password' + genericId).val(this.$('#passwordText' + genericId).val());
        this.indicatePasswordStrength();
      },

      onConfirmPasswordTextKeyup: function () {
        this.$('#confirmPassword' + genericId).val(this.$('#confirmPasswordText' + genericId).val());
      }
    }, {
      template: 'passwordFields'
    });

    return new view({model: opts.model}).render();
  }

  return PasswordFieldsView;
});
