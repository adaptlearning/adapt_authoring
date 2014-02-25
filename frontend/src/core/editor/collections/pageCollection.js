define(function(require) {

    var Backbone = require('backbone');
    var PageModel = require('coreJS/editor/models/pageModel');

    var PageCollection = Backbone.Collection.extend({

        model: PageModel,

        url: function() {
            return 'api/content/page'
        },

        initialize : function(options) {
            this.fetch({reset:true});
        }
    });

    return PageCollection;

});
