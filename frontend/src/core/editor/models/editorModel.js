define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');
    var EditorPageCollection = require('coreJS/editor/collections/editorPageCollection');

    var EditorModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/course',

      initialize : function(options) {
         this._id = options._id;

         this.pageCollection = new EditorPageCollection({_parentId: this._id});
      }
    });

    return EditorModel;

});
