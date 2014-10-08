define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var UserProfileModel = Backbone.Model.extend({

    idAttribute: '_id',
    url: '/api/user/me',

    validate: function (attributes, options) {
    	var validationErrors = {};

    	if (!attributes.firstName) {
    		validationErrors.firstName = 'Firstname is required';
    	}

    	if (!attributes.lastName) {
    		validationErrors.lastName = 'Lastname is required';
    	}


    	return validationErrors;
    }

  });

  return UserProfileModel;

});