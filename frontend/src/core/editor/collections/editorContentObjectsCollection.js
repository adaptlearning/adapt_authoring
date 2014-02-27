define(function(require) {

  var Backbone = require('backbone');

  var EditorContentObjectsCollection = Backbone.Collection.extend({

    initialize: function(options) {
      this.url = options.url;
      console.log('collection loading');
    }

  });

  return EditorContentObjectsCollection;

});