define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var BlockModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/content/block'

  });

  return BlockModel;

});
