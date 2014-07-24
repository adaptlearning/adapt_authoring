define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var UserPasswordResetModel = Backbone.Model.extend({

    defaults: {
      _id: -1,
      user: false,
      token: false,
      tokenCreated: false,
      ipAddress: false
    },

    initialize : function(options) {},

    url: function () {
      return "/api/userpasswordreset/" + this.get('token');
    },

    resetPassword: function (password, cback) {
      var model = this;

      $.post(
        '/api/resetpassword',
        {
          user: model.get('user'),
          password: password,
          token: model.get('token')
        },
        function(result) {
          cback(false, result);
        }
      );
    }

  });

  return UserPasswordResetModel;

});
