// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,
    
    events: {
      'click .reveal-password-button' : 'togglePasswordView'
    },

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.addusertitle') });
      this.listenTo(Origin, 'userManagement:saveUser', this.saveNewUser);
    },

    postRender: function() {
      this.setViewToReady();
    },

    isValid: function() {
      var valid = true;

      this.$('.field-error').each(function(index, element) {
        var $error = $(element);
        var $input = $error.siblings('input');

        var isValid = $input.attr('name') === 'email' ?
          Helpers.isValidEmail($input.val().trim()) :
          $input.val().trim().length > 0;

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
      Origin.Notify.alert({
        type: 'error',
        title: "Couldn't add user",
        text: data.responseText || error
      });
    },

    togglePasswordView: function() {
      event && event.preventDefault();
      
      var passwordField = document.querySelector('.reveal-input-password');
      var passwordReveal = document.querySelector('.reveal-password-button');

      if (passwordField.getAttribute('type') == 'password') {
        passwordField.setAttribute('type', 'text');
        passwordReveal.setAttribute('aria-pressed', 'true');
      } else {
        passwordField.setAttribute('type', 'password');
        passwordReveal.setAttribute('aria-pressed', 'false');
      }
    }
  }, {
    template: 'addUser'
  });

  return AddUserView;
});
