// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.addusertitle') });
      this.listenTo(Origin, 'userManagement:saveUser', this.saveNewUser);
    },

    postRender: function() {
      this.setViewToReady();
    },

    isValid: function() {
      var email = this.$('input[name=email]').val().trim();
      var valid = Helpers.isValidEmail(email);
      if(valid) {
        this.$('.field-error').addClass('display-none');
      } else {
        this.$('.field-error').removeClass('display-none');
        Origin.Notify.alert({
          type: 'error',
          title: window.polyglot.t('app.validationfailed'),
          text: window.polyglot.t('app.invalidusernameoremail')
        });
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
      Origin.router.navigate('#/userManagement', { trigger:true });
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
