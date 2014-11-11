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

    initialize : function(options) {  
    console.log("Call of init function: " + new Date().getMilliseconds());   
      this.attributes.token = window.location.hash.substr(window.location.hash.lastIndexOf('/')+1);     
    },

    url: function () {
      console.log("Call of url function: " + new Date().getMilliseconds());
      return "/api/userpasswordreset/" + this.get('token');
    },

    resetPassword: function (password, cback) {
      console.log("Call of resetPassword function with token: " + this.get('token')  + " " + new Date().getMilliseconds());
      var model = this;             
      $.post(
        model.url(),
        {          
          password: password,
          token: this.get('token')
        },
        function(result) {
          cback(false, result);
        }
      );
    }

  });

  return UserPasswordResetModel;

});
