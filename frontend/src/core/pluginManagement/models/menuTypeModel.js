define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var MenuTypeModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/menutype'

  });

  return MenuTypeModel;

});
