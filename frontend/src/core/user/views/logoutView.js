define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');

  var LogoutView = OriginView.extend({

    tagName: "div",

    className: "logout",

    events: {
      'click .logout a#linkLogout' : 'completeLogout'
    },

    completeLogout: function(e) {
      e.preventDefault();
      this.model.logout();
    }

  }, 
  {
    template: 'logout'
  });

  return LogoutView;

});