// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SuperToolbarView = require('./views/superToolbarView.js');

  Origin.on('superToolbar:add', function(buttons) {
    if (Origin.permissions.hasPermissions(["*/*:create","*/*:read","*/*:update","*/*:delete"])) {
      remove(); // clean up old instances first
      // add new
      var toolbar = new SuperToolbarView();
      toolbar.setButtons(buttons);
      $('.location-title').append(toolbar.$el);
    }
    else remove();
  });
  // make sure it's not left for non-admins
  Origin.on('app:dataReady login:changed', remove);

  function remove() {
    $('.location-title').remove('.superToolbar');
  };
});
