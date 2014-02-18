define(function(require) {
  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');

  var LogoutView = BuilderView.extend({

    tagName: "div",

    className: "logout",

    events: {
      'click .logout a#linkLogout' : 'completeLogout'
    },

    completeLogout: function(e) {
      e.preventDefault();
      this.model.logout(function(){
        Backbone.history.navigate('/#user/login', {trigger: true});
      });
    }

  }, 
  {
    template: 'logout'
  });

  return LogoutView;

});