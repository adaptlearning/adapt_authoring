// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var UserProfileView = OriginView.extend({

    tagName: 'div',

    className: 'user-profile',

    events: {
      'click a.change-password' : 'togglePassword',
      'keyup #password'         : 'indicatePasswordStrength'
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
      var self = this;

      if (error && _.keys(error).length !== 0) {
        _.each(error, function(value, key) {
          self.$('#' + key + 'Error').text(value);
        });
      }

      console.log(error);
    },

    togglePassword: function(event) {
      event.preventDefault();

      if (this.model.get('_isNewPassword')) {
        this.model.set('_isNewPassword', false);
      } else {
        this.model.set('_isNewPassword', true);
      }
    },

    togglePasswordUI: function(model, showPaswordUI) {
      if (showPaswordUI) {
        this.$('div.change-password-section').removeClass('display-none');
        this.$('.change-password').text(window.polyglot.t('app.undochangepassword'));
      } else {
        this.$('.change-password').text(window.polyglot.t('app.changepassword'));       
        this.$('div.change-password-section').addClass('display-none');
        this.$('#password').val('');
        this.$('#confirmPassword').val('');
        this.model.set('password', '');
        this.model.set('confirmPassword', '');
      }
    },

    indicatePasswordStrength: function(event) {
      var password = $('#password').val();
      var $passwordStrength = $('#passwordStrength');
      // Must have capital letter, numbers and lowercase letters
      var strongRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");

      // Must have either capitals and lowercase letters or lowercase and numbers
      var mediumRegex = new RegExp("^(?=.{7,})(((?=.*[A-Z])(?=.*[a-z]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))).*$", "g");

      // Must be at least 8 characters long
      var okRegex = new RegExp("(?=.{8,}).*", "g");
      
      if (okRegex.test(password) === false) {
        // If ok regex doesn't match the password
        $('#passwordStrength').removeClass().addClass('alert alert-error').html(window.polyglot.t('app.validationlength', {length: 8}));
      } else if (strongRegex.test(password)) {
        // If reg ex matches strong password
        $passwordStrength.removeClass().addClass('alert alert-success').html(window.polyglot.t('app.passwordindicatorstrong'));
      } else if (mediumRegex.test(password)) {
        // If medium password matches the reg ex
        $passwordStrength.removeClass().addClass('alert alert-info').html(window.polyglot.t('app.passwordindicatormedium'));
      } else {
        // If password is ok
        $passwordStrength.removeClass().addClass('alert alert-error').html(window.polyglot.t('app.passwordindicatorweak'));
      }
    },

    saveUser: function() {
      var self = this;

      this.model.set('firstName', self.$('#firstName').val().trim());
      this.model.set('lastName', self.$('#lastName').val().trim());

      if (self.model.get('_isNewPassword')) {
        self.model.set('password', self.$('#password').val());
        self.model.set('confirmPassword', self.$('#confirmPassword').val());
      } else {
        self.model.unset('password');
        self.model.unset('confirmPassword');
      }

      self.model.save({}, {
        error: function(model, response, optinos) {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorgeneric')
          });
        },
        success: function(model, response, options) {
          Backbone.history.history.back();
          Origin.trigger('editingOverlay:views:hide');
        }
      });
    }
    
  }, {
    template: 'userProfile'
  });

  return UserProfileView;

});
