define(["backbone", "handlebars", "jquery"], function(Backbone, Handlebars, $){

 var LoginView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    events: {
      "click a#linkRegister" : "gotoRegister",
      "click a#linkForgotPassword" : "gotoForgotPassword",
      "click button":"submitLoginDetails"
    },
    
    render: function() {
      var template = Handlebars.templates['login'];
      this.$el.html(template());
      return this;
    },

    gotoForgotPassword: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/login/forgot', {trigger: true});
    },

    gotoRegister: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/register', {trigger: true});
    },
    submitLoginDetails: function(e) {
      e.preventDefault();
      // Do some crazy validation here
      var inputUsernameEmail = $("#inputUsernameEmail", this.$el).val();
      var inputPassword = $("#inputPassword", this.$el).val();
      
      // Save the model - might want to think about a fail as well as a success
      this.model.save({
        email:inputUsernameEmail,
        password:inputPassword
      }, {
        success: _.bind(function(response) {
          if (this.model.get('success')) {
            // trigger an event to load the dashboard view
            console.log('you got in');
          } else {
            // user needs to try again
            console.log('you did not get in');
          }  
        }, this)
      })

    }
  });

  return LoginView;

});
