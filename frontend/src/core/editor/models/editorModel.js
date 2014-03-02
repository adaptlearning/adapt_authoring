define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');
    var EditorPageCollection = require('coreJS/editor/collections/editorPageCollection');

    var EditorModel = Backbone.Model.extend({

      initialize : function(options) {
        this.url = options.url;
         /*this._id = options._id;

         this.pageCollection = new EditorPageCollection({_parentId: this._id});*/
         this.once('reset', this.loadedData, this);
         this.fetch();
      },
      loadedData: function() {
        Origin.trigger('editorModel:dataLoaded');
      }
    });

    return EditorModel;

});
