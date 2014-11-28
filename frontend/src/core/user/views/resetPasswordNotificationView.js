define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var ResetPasswordNotificationView = OriginView.extend({

    tagName: "div",

    className: "password-notification",

    events: {
      'click .submit':'generatePassword'
    },

  postRender: function() {
      this.setViewToReady();
    },



    generatePassword: function(e) {
        // ToDo: Generate password

      }

  }, {
    template: 'resetPasswordNotification'
  });

  return ResetPasswordNotificationView;

});
