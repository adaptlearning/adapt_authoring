define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/app/adaptbuilder');
    var PageCollection = require('coreJS/editor/collections/pageCollection');

    var EditorModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/course',

      initialize : function(options) {
         this._id = options._id;
      },

      pages: function() {
        return new PageCollection({_parentId: this._id});
      }
    });

    return EditorModel;

});
