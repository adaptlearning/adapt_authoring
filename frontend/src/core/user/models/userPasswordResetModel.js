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
      this.attributes.token = window.location.hash.substr(window.location.hash.lastIndexOf('/')+1); 
    },
    validateToken : function(callback){      
      $.get("/api/userpasswordreset/" + this.get('token'), callback);      
    },
    url: function () {      
      return "/api/userpasswordreset/" + this.get('token');
    },

    resetPassword: function (password, cback) {
      var model = this;             
      $.post('/api/handleResetPassword/',
        {          
          password: password,
          token: this.get('token')
        },
        function(result) {          
          cback(result);
        }
      );
    },

    validatePassword: function (password, confirmPassword) {
      var validationErrors = {};

        if (!password) {
          validationErrors.password = window.polyglot.t('app.passwordrequired');
        } else {
          if (password.length < 8) {            
            validationErrors.password = window.polyglot.t('app.validationlength', {length: 8});
          }
        }

          if (password !== confirmPassword) {
            validationErrors.confirmPassword = window.polyglot.t('app.validationpasswordmatch');
          }   

      return _.isEmpty(validationErrors) 
      ? null
      : validationErrors;
    }

  });

  return UserPasswordResetModel;

});
