// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var PasswordFieldsView = require('plugins/passwordChange/views/passwordFieldsView');
  var PasswordHelpers = require('plugins/passwordChange/passwordHelpers');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.addusertitle') });
      this.listenTo(Origin, 'userManagement:saveUser', this.saveNewUser);
    },

    postRender: function() {
      this.model.set('fieldId', 'password');
      var passwordFieldsView = PasswordFieldsView({ model: this.model }).el;
      this.$('#passwordField').append(passwordFieldsView);
      this.setViewToReady();
    },

    isValid: function() {
      var valid = true;

      this.$('.field-error').each(function(index, element) {
        var $error = $(element);
        var $input = $error.parent().siblings('input').length > 0 ? $error.parent().siblings('input') : $error.parent().siblings('.password-wrapper').find('input');

        var isValid = $input.attr('name') === 'email' ?
          Helpers.isValidEmail($input.val().trim()) :
          $input.val().trim().length > 0;

        if ($input.attr('name') === 'password') {
          var passwordErrors = PasswordHelpers.validatePassword($input.val());
          isValid = passwordErrors.length == 0;
          !isValid ? $error.html(`${Origin.l10n.t('app.passwordindicatormedium')}`) : '';
        }

        if ($input.attr('name') === 'confirmPassword') {
          isValid = PasswordHelpers.validateConfirmationPassword($('[name="password"]').val(), $input.val());
          !isValid ? $error.html(`${Origin.l10n.t('app.confirmpasswordnotmatch')}`) : '';
        }

        $error.toggleClass('display-none', isValid);

        if (!isValid) {
          valid = false;
        }
      });

      return valid;
    },

    saveNewUser: function() {
      if(!this.isValid()) {
        return;
      }
      // submit form data
      this.$('form.addUser').ajaxSubmit({
        error: _.bind(this.onAjaxError, this),
        success: _.bind(this.onFormSubmitSuccess, this)
      });

      return false;
    },

    goBack: function() {
      Origin.router.navigateTo('userManagement');
    },

    onFormSubmitSuccess: function(userData, userStatus, userXhr) {
      this.createdUserId = userData._id;

      var self = this;
      var chosenRole = $('form.addUser select[name=role]').val();
      var defaultRole = userData.roles[0];

      if(chosenRole !== defaultRole) {
        // unassign the default role
        $.ajax('api/role/' + defaultRole + '/unassign/' + userData._id,{
          method: 'POST',
          error: _.bind(self.onAjaxError, self),
          success: function() {
            // assign chosen role
            $.ajax('api/role/' + chosenRole + '/assign/' + userData._id,{
              method: 'POST',
              error: _.bind(self.onAjaxError, self),
              success: _.bind(self.onAjaxSuccess, self)
            });
          }
        });
      } else {
        this.onAjaxSuccess();
      }
    },

    onAjaxSuccess: function() {
      this.goBack();
    },

    onAjaxError: function(data, status, error) {
      // We may have a partially created user, make sure it's gone
      if(this.createdUserId) {
        $.ajax('api/user/' + this.createdUserId, { method: 'DELETE', error: _.bind(this.onAjaxError, this) });
      }
      // for server error messages - will remove in future
      var errMsg = Helpers.translateData(data);

      Origin.Notify.alert({
        type: 'error',
        title: "Couldn't add user",
        text: errMsg
      });
    }
  }, {
    template: 'addUser'
  });

  return AddUserView;
});
