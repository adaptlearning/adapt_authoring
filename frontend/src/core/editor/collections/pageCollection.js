define(function(require) {

    var Backbone = require('backbone');
    var PageModel = require('coreJS/editor/models/pageModel');

    var PageCollection = Backbone.Collection.extend({

        model: PageModel,

        url: function() {
            var url = 'api/content/page';

            if (this._parentId) {
                url = url + '?_parentId=' + this._parentId;
            }

            return url;
        },

        initialize : function(options) {
            this._parentId = options._parentId;
            this.fetch({reset:true});
        }
    });

    return PageCollection;

});
