// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var UserProfileView = OriginView.extend({
    tagName: 'div',
    className: 'user-profile',

    events: {
      'click a.change-password' : 'togglePassword',
      'keyup #password'         : 'onPasswordKeyup',
      'keyup #passwordText'     : 'onPasswordTextKeyup',
      'click .toggle-password'  : 'togglePasswordView'
    },

    preRender: function() {
      this.listenTo(Origin, 'userProfileSidebar:views:save', this.saveUser);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
      this.listenTo(this.model, 'change:_isNewPassword', this.togglePasswordUI);

      this.model.set('_isNewPassword', false);
    },

    postRender: function() {
      this.setViewToReady();
    },

    handleValidationError: function(model, error) {
      Origin.trigger('sidebar:resetButtons');

      if (error && _.keys(error).length !== 0) {
        _.each(error, function(value, key) {
          this.$('#' + key + 'Error').html(value);
        }, this);
        this.$('.error-text').removeClass('display-none');
      }
    },

    togglePassword: function(event) {
      event && event.preventDefault();
      // convert to bool and invert
      this.model.set('_isNewPassword', !!!this.model.get('_isNewPassword'));
    },

    togglePasswordUI: function(model, showPaswordUI) {
      var formSelector = 'div.change-password-section .form-group .inner';
      var buttonSelector = '.change-password';

      if (showPaswordUI) {
        this.$(formSelector).removeClass('display-none');
        this.$(buttonSelector).text(Origin.l10n.t('app.cancel'));
      } else {
        this.$(buttonSelector).text(Origin.l10n.t('app.changepassword'));
        this.$(formSelector).addClass('display-none');

        this.$('#password').val('').removeClass('display-none');
        this.$('#passwordText').val('').addClass('display-none');
        this.$('.toggle-password i').addClass('fa-eye').removeClass('fa-eye-slash');

        this.$('.toggle-password').addClass('display-none');
        this.$('#passwordError').html('');

        this.model.set('password', '');
      }
    },

    togglePasswordView: function() {
      event && event.preventDefault();

      this.$('#passwordText').toggleClass('display-none');
      this.$('#password').toggleClass('display-none');
      this.$('.toggle-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
    },

    indicatePasswordStrength: function(event) {
      var password = $('#password').val();
      var $passwordStrength = $('#passwordError');

      var errors = Helpers.getPasswordErrors(password);
      var htmlText = '';

      if (errors && errors.length > 0) {
        var classes = 'alert alert-error';
        _.each(errors, function (err) {
          htmlText += `<li>${err}</li>`;
        });

        // note: don't use alert class
        htmlText = `<ul id="ariaPasswordError" role="alert" aria-live="assertive" aria-atomic="true">${htmlText}</ul>`;
        
      } else {
        var classes = 'alert alert-success';
        htmlText = Origin.l10n.t('app.passwordindicatorstrong');
      }
      $passwordStrength.removeClass().addClass(classes).html(htmlText);
    },

    saveUser: function() {
      var self = this;
      var prevEmail = self.model.get('email');

      this.$('.error-text').addClass('display-none');
      this.$('.error').text('');

      var toChange = {
        firstName: self.$('#firstName').val().trim(),
        lastName: self.$('#lastName').val().trim(),
        email: self.$('#email').val().trim()
      };

      if (self.model.get('_isNewPassword')) {
        toChange._isNewPassword = true;
        toChange.password = self.$('#password').val();
        toChange.confirmPassword = self.$('#confirmPassword').val();
      } else {
        self.model.unset('password');
      }

      _.extend(toChange, {
        _id: self.model.get('_id'),
        email_prev: prevEmail
      });

      self.model.save(toChange, {
        wait: true,
        patch: true,
        error: function(data, error) {
          Origin.trigger('sidebar:resetButtons');
          Origin.Notify.alert({
            type: 'error',
            text: error.responseText || Origin.l10n.t('app.errorgeneric')
          });
        },
        success: function(model) {
          if (prevEmail !== model.get('email')) {
            Origin.router.navigateTo('user/logout');
          } else {
            Backbone.history.history.back();
          }
        }
      });
    },

    onPasswordKeyup: function() {
      if(this.$('#password').val().length > 0) {
        this.$('#passwordText').val(this.$('#password').val());
        this.indicatePasswordStrength();
        this.$('.toggle-password').removeClass('display-none');
      } else {
        this.$('.toggle-password').addClass('display-none');
      }
    },

    onPasswordTextKeyup: function() {

    }
  }, {
    template: 'userProfile'
  });

  return UserProfileView;
});
