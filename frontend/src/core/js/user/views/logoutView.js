define(function(require) {
  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');

  var LogoutView = BuilderView.extend({

    tagName: "div",

    className: "logout",

    events: {
      "click .logout a#linkLogout" : "completeLogout",
      "click .logout a#linkDash" : "gotoDashboard"
    },

    completeLogout: function(e) {
      e.preventDefault();

      this.model.logout(function(){
        Backbone.history.navigate('/', {trigger: true});
      });
    },

    gotoDashboard: function () {
      Backbone.history.navigate('/dashboard', {trigger: true});
    }

  }, 
  {
    template: 'logout'
  });

  return LogoutView;

});