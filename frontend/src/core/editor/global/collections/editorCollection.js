// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var EditorCollection = Backbone.Collection.extend({
    initialize : function(models, options){
      this.url = options.url;
      this._type = options._type;
      this.fetch({ reset: true, success: _.bind(this.loadedData, this) });
    },

    loadedData: function() {
      Origin.trigger('editorCollection:dataLoaded', this._type);
    }
  });

  return EditorCollection;
});
