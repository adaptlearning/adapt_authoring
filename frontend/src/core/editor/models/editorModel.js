define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');

    var EditorModel = Backbone.Model.extend({

      idAttribute: '_id',

      initialize : function(options) {
        if (options.url) {
          this.url = options.url;
        }
        this.urlRoot = options.urlRoot;
        this.once('reset', this.loadedData, this);
        this.fetch();
      },
      loadedData: function() {
        Origin.trigger('editorModel:dataLoaded');
      }
    });

    return EditorModel;

});
