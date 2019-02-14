// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.addusertitle') });
      this.listenTo(Origin, 'userManagement:saveUser', this.saveNewUser);
    },

    postRender: function() {
      this.setViewToReady();
    },

    isValid: function() {
      var valid = true;
      var map = Object.create(null);

      this.$('.field-error').each(function(index, element) {
        var $error = $(element);
        var $input = $error.siblings('input');
        var values = {
          $error: $error,
          value: $input.val().trim()
        };

        map[$input.attr('name')] = values;
      });

      for (var name in map) {
        switch (name) {
          case 'email':
            var isValid = Helpers.isValidEmail(map[name].value);
          break;
          case 'password':
            var errors = Helpers.validatePassword(map[name].value, map.email.value, map.firstName.value, map.lastName.value);
            var isValid = (errors.length === 0);
            if (!isValid) map[name].$error.html(errors.join('<br>'));
          break;
          default:
            var isValid = (map[name].value.length > 0);
          break;
        }

        map[name].$error.toggleClass('display-none', isValid);

        if (!isValid) {
          valid = false;
        }
      }


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
        $.ajax('/api/role/' + defaultRole + '/unassign/' + userData._id,{
          method: 'POST',
          error: _.bind(self.onAjaxError, self),
          success: function() {
            // assign chosen role
            $.ajax('/api/role/' + chosenRole + '/assign/' + userData._id,{
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
        $.ajax('/api/user/' + this.createdUserId, { method: 'DELETE', error: _.bind(this.onAjaxError, this) });
      }
      Origin.Notify.alert({
        type: 'error',
        title: "Couldn't add user",
        text: data.responseText || error
      });
    }
  }, {
    template: 'addUser'
  });

  return AddUserView;
});
