define(function(require) {

  var Backbone = require('backbone');
  var AdaptModel = require('coreJS/app/models/adaptModel');

  var EditorContentObjectsCollection = Backbone.Collection.extend({

  	model: AdaptModel,

    initialize: function(options) {
      this.url = options.url;
      console.log('collection loading');
    }

  });

  return EditorContentObjectsCollection;

});