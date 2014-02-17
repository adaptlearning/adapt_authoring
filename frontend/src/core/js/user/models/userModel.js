define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/adaptbuilder');

  var UserModel = Backbone.Model.extend({

    defaults: {
      isAuthenticated: false,
      id: '',
      email: ''
    },

    url: "/api/authcheck",

    initialize: function() {
    },

    logout: function (cback) {
      var model = this;
      $.post(
        '/api/logout',
        function(){
        model.fetch().always(function(){
          model.attributes['email'] = '';
          model.attributes['id'] = '';
          
          AdaptBuilder.trigger('login:changed');
          Backbone.history.navigate('/login', {trigger: true});
        });
      });
    },

    login: function (username, password, cback) {
      var model = this;

      $.post(
        '/api/login',
        {
          email: username,
          password: password
        },
        function(authenticated) {
          model.fetch().done(function(){
            model.attributes['id'] = authenticated['id'];
            model.attributes['email'] = authenticated['email'];            

            AdaptBuilder.trigger('login:changed');
            Backbone.history.navigate('/dashboard', {trigger: true});
          });
      }).fail( function() {
        cback(new Error('Request failed'));
      });
    },
  });

  return UserModel;

});