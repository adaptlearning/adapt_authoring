define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');

    var EditorModel = Backbone.Model.extend({

      idAttribute: '_id',

      initialize : function(options) {
        /*if (options.url) {
          this.url = options.url;
        }
        if (options.urlRoot) {
          this.urlRoot = options.urlRoot;
        }*/
        this.once('sync', this.loadedData, this);
        this.fetch();
      },
      loadedData: function() {
        if (this.constructor._siblings) {
          this._type = this.constructor._siblings;
        } else {
          this._type = 'course';
        }
        Origin.trigger('editorModel:dataLoaded', this._type);
      },

      getChildren: function() {
        
        var children = Origin.editor[this._children].where({_parentId:this.get("_id")});
        var childrenCollection = new Backbone.Collection(children);
        // returns a collection of children
        return childrenCollection;
      },
    });

    return EditorModel;

});
