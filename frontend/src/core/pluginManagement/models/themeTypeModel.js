define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ThemeTypeModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/themetype'

  });

  return ThemeTypeModel;

});
