define(["backbone", "coreViews/homeView", "coreViews/loginView", "coreViews/forgotPasswordView"], function(Backbone, HomeView, LoginView, ForgotPasswordView) {
  
  var Router = Backbone.Router.extend({
    
    routes: { 
      ""              : "index",    //
      "home"          : "index",    // #home
      "login"         : "login",    // #login
      "login/forgot"  : "forgotpassword", // #login/forgot
      "register"      : "register"  // #register
    },

    initialize: function() {
     console.log('In init');
    },

    _renderView: function(view) {
      $("#app").html(view.render().el);
    },

    index: function() {
      console.log('In index');
      var view = new HomeView();
      this._renderView(view);
    },

    login: function() {
      console.log('Login');
      var view = new LoginView();
      this._renderView(view);
    },

    forgotpassword: function() {
      var view = new ForgotPasswordView();
      this._renderView(view);
    }

  });
  
  return new Router;
  
});