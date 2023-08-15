// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var _ = require('underscore');

  var UserInfoModel = Backbone.Model.extend({

    idAttribute: '_id',
    url: 'api/user/me',

    validate: function (attributes, options) {
      var validationErrors = {};
      return _.isEmpty(validationErrors) 
      ? null
      : validationErrors;
    }

  });

  return UserInfoModel;

});