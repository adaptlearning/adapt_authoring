// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var UserProfileView = OriginView.extend({
    tagName: 'div',
    className: 'user-profile',

    events: {
      'click a.change-password' : 'togglePassword',
      'keyup #password'         : 'onPasswordKeyup',
      'keyup #passwordText'         : 'onPasswordTextKeyup',
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
          this.$('#' + key + 'Error').text(value);
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

      // Must have capital letter, numbers and lowercase letters
      var strongRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");
      // Must have either capitals and lowercase letters or lowercase and numbers
      var mediumRegex = new RegExp("^(?=.{7,})(((?=.*[A-Z])(?=.*[a-z]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))).*$", "g");
      // Must be at least 8 characters long
      var okRegex = new RegExp("(?=.{8,}).*", "g");

      if (okRegex.test(password) === false) {
        var classes = 'alert alert-error';
        var htmlText = Origin.l10n.t('app.validationlength', {length: 8});
      } else if (strongRegex.test(password)) {
        var classes = 'alert alert-success';
        var htmlText = Origin.l10n.t('app.passwordindicatorstrong');
      } else if (mediumRegex.test(password)) {
        var classes = 'alert alert-info';
        var htmlText = Origin.l10n.t('app.passwordindicatormedium');
      } else {
        var classes = 'alert alert-info';
        var htmlText = Origin.l10n.t('app.passwordindicatorweak');
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
