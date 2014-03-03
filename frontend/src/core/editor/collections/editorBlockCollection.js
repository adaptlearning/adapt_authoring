define(function(require) {

    var Backbone = require('backbone');
    var EditorBlockModel = require('coreJS/editor/models/editorBlockModel');

    var ArticleBlockCollection = Backbone.Collection.extend({

        model: EditorBlockModel,

        url: function() {
            var url = 'api/content/block';

            if (this._parentId) {
                url = url + '?_parentId=' + this._parentId;
            }

            return url;
        },

        initialize : function(options) {
            if (options) {
                if (options._id) {
                    this._id = options._id;
                }
                if (options._parentId) {
                    this._parentId = options._parentId;
                }
            }
        }
    });

    return ArticleBlockCollection;

});
