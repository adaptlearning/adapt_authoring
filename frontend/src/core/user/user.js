define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  Origin.on('navigation:user:logout', function() {
    Origin.router.navigate('#/user/logout');
  });

  Origin.on('navigation:profile:toggle', function() {
    console.log('Should show profile');
  });
})