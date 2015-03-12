// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var EditorThemeTypeModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/themetype'

  });

  return EditorThemeTypeModel;

});