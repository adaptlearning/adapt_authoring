// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SuperToolbarView = require('./views/superToolbarView.js');

  Origin.on('app:dataReady login:changed', function() {
    if (Origin.permissions.hasPermissions(["*/*:create","*/*:read","*/*:update","*/*:delete"])) {
      var toolbar = new SuperToolbarView();
      Origin.on('superToolbar:add', function(buttons) {
        toolbar.setButtons(buttons);
        $('.location-title').append(toolbar.$el);
      });
    }
  });
});
