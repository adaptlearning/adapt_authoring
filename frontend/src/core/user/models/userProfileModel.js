define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var UserProfileModel = Backbone.Model.extend({

    // idAttribute: '_id',

    url: '/api/user/me'

  });

  return UserProfileModel;

});