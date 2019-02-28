// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var UserProfileView = OriginView.extend({
    className: 'user-profile',

    events: {
      'click .change-password': 'togglePassword',
      'click .toggle-password': 'togglePasswordView'
    },

    preRender: function() {
      this.listenTo(Origin, 'userProfileSidebar:views:save', this.saveUser);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
      this.listenTo(this.model, 'change:_isNewPassword', this.togglePasswordUI);

      this.model.set('_isNewPassword', false);
    },

    postRender: function() {
      this.setViewToReady();

      this.$password = this.$('#password');
    },

    handleValidationError: function(model, error) {
      Origin.trigger('sidebar:resetButtons');

      if (!error || _.keys(error).length === 0) return;
      _.each(error, function(value, key) {
        this.$('#' + key + 'Error').html(value);
      }, this);
      this.$('.error-text').removeClass('display-none');
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
        this.$('.toggle-password i').addClass('fa-eye').removeClass('fa-eye-slash');

        this.$('#passwordError').html('');

        this.model.set('password', '');
      }
    },

    togglePasswordView: function() {
      event && event.preventDefault();

      var type = (this.$password.attr('type') === 'password') ? 'text' : 'password';
      this.$password.attr('type', type);
      this.$('.toggle-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
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
        error: function(model, response, optinos) {
          Origin.trigger('sidebar:resetButtons');

          if (response.responseJSON && response.responseJSON.message) {
            return Origin.Notify.alert({
              type: 'error',
              text: response.responseJSON.message
            });
          }

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
    }

  }, {
    template: 'userProfile'
  });

  return UserProfileView;
});
