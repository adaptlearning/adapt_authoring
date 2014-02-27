define(function(require) {

    var Backbone = require('backbone');
    var PageArticleModel = require('coreJS/editor/models/pageArticleModel');

    var PageArticleCollection = Backbone.Collection.extend({

        model: PageArticleModel,

        url: function() {
            var url = 'api/content/article';

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

    return PageArticleCollection;

});
