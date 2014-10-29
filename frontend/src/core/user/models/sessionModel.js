define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  

  var SessionModel = Backbone.Model.extend({

    defaults: {
      isAuthenticated: false,
      id: '',
      email: ''
    },

    url: "/api/authcheck",

    initialize: function() {},

    logout: function (cback) {
      var model = this;
      $.post(
        '/api/logout',
        function(){
          model.attributes['email'] = '';
          model.attributes['id'] = '';
          model.attributes['isAuthenticated'] = false;
          
          Origin.trigger('login:changed');

          Backbone.history.navigate('#/user/login', {trigger: true});
      });
    },

    login: function (username, password, cback) {
      var model = this;

      $.post('/api/login', {email: username, password: password},
        function(authenticated) {
          model.fetch().done(function(){
            model.attributes['id'] = authenticated['id'];
            model.attributes['email'] = authenticated['email'];            

            Origin.trigger('login:changed');
            
            Backbone.history.navigate('#/dashboard', {trigger: true});
          });
      })
      .fail(function() {
        Origin.trigger('login:failed');
      });
    },

    generateResetToken: function (username, cback) {
      var model = this;

      $.post(
        '/api/createtoken',
        {
          email: username
        },
        function(result) {
          if (result.success) {
            cback(false, result);
          }
        }
      );
    },

    sendTokenEmail: function (email, cback) {
      // 1: Check if email exists
      // Hier abbrechen wenn email nicht passt
      // 2: Generate Token and save it to DB
      // Todo later: diese funktion aus der generateResetToken aufrufen und token mitgeben
      // 3: Send Email
      $.get(
        '/api/useremail',
        {
          email: "email"
        },
        function(result) {
          if (result.success) {
             console.log("result success");
            cback(false, result);
          }
        }
      );

    }



  });

  return SessionModel;

});