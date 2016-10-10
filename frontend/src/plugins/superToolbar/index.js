// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SuperToolbarView = require('./views/SuperToolbarView.js');

  Origin.on('app:dataReady', function() {
    var permissions = ["*/*:create","*/*:read","*/*:update","*/*:delete"];
    if (Origin.permissions.hasPermissions(permissions)) {
      var toolbar = new SuperToolbarView();
      $('.app-inner').prepend(toolbar.$el);
      toolbar.$el.hide();

      Origin.on('superToolbar:add', function(buttons) {
        toolbar.setButtons(buttons);
        toolbar.$el.show();
      });

      Origin.router.on('route', function() {
        toolbar.$el.hide();
      });
    }
  });
});
