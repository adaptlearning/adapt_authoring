define(function(require) {

    var Backbone = require('backbone');
    var PageModel = require('coreJS/editor/models/pageModel');

    var PageCollection = Backbone.Collection.extend({

        model: PageModel,

        url: function() {
            var url = 'api/content/contentObject';

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
            this.fetch({reset:true});
        }
    });

    return PageCollection;

});
