define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/adaptbuilder');

  var LoginModel = Backbone.Model.extend({

    defaults: {
      authenticated: false
    },

    url: "/api/authcheck",

    initialize: function() {
      /*this.listenTo(this, 'change:authenticated', this.authChange);*/
    },

    logout: function (cback) {
      /*var mdl = this;
      $.post(
        '/api/logout',
        function(){
        mdl.fetch().always(function(){
          //mdl.set('authenticated', false);
          cback();
        });
      });*/
    },

    login: function (username, password, cback) {
      var model = this;

      $.post(
        '/api/login',
        {
          email:username,
          password:password
        },
        function(authenticated) {
          model.fetch();
          cback(null, authenticated);
      }).fail( function() {
        cback(new Error('Request failed'));
      });
    },
  });

  return LoginModel;

});