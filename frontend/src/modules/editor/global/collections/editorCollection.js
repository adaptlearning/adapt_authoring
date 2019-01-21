// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var EditorCollection = Backbone.Collection.extend({
    comparator: 'displayName',

    initialize : function(models, options){
      this.url = options.url;
      this._type = options._type;
      this.on('reset', this.loadedData, this);
      if(options.autoFetch !== false){
        this.fetch({ reset:true });
      }
    },

    loadedData: function() {
      Origin.trigger('editorCollection:dataLoaded', this._type);
    }
  });

  return EditorCollection;
});
