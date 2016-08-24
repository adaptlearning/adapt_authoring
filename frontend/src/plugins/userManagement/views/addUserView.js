// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',

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

      var self = this;
      // submit form data
      this.$('form.addUser').ajaxSubmit({
        error: _.bind(this.onAjaxError),
        success: _.bind(this.onAjaxSuccess, this)
      });

      return false;
    },

    goBack: function() {
      Origin.router.navigate('#/userManagement', { trigger:true });
    },

    onAjaxSuccess: function(userData, userStatus, userXhr) {
      var self = this;
      var roleID = $('form.addUser select[name=role]').val();
      // HACK find the default role dynamically
      var defaultRole = '565f304ddca12e4b3702e579';
      if(roleID !== defaultRole) {
        // unassign the default role
        $.ajax('/api/role/' + defaultRole + '/unassign/' + userData._id,{
          method: 'POST',
          error: self.onAjaxError,
          success: function() {
            // assign chosen role
            $.ajax('/api/role/' + roleID + '/assign/' + userData._id,{
              method: 'POST',
              error: self.onAjaxError,
              success: function() {
                self.goBack();
              }
            });
          }
        });
      }
      else self.goBack();
    },

    onAjaxError: function(data, status, error) {
      // TODO we may have partially created users at this point, need to make sure they're gone
      Origin.Notify.alert({
        type: 'error',
        title: "Couldn't add user",
        text: data.responseText || error
      });
    },

  }, {
    template: 'addUser'
  });

  return AddUserView;
});
