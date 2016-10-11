// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SuperToolbarView = require('./views/superToolbarView.js');

  Origin.on('app:dataReady login:changed', function() {
    var toolbar = new SuperToolbarView();
    if (Origin.permissions.hasPermissions(["*/*:create","*/*:read","*/*:update","*/*:delete"])) {
      Origin.on('superToolbar:add', function(buttons) {
        toolbar.setButtons(buttons);
        if($(toolbar.className).length === 0) {
          $('.location-title').append(toolbar.$el);
        }
      });
    } else {
      $('.location-title').remove(toolbar.className);
    }
  });
});
