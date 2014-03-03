define(function(require) {

    var Backbone = require('backbone');
    var EditorPageModel = require('coreJS/editor/models/editorPageModel');

    var PageCollection = Backbone.Collection.extend({

        model: EditorPageModel,

        url: function() {
            var url = 'api/content/contentObject';

            if (this._parentId) {
                url = url + '?_parentId=' + this._parentId + '&_type=page';
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
            this.fetch({reset:true});
        }
    });

    return PageCollection;

});
