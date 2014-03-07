define(function(require) {

    var Backbone = require('backbone');

    var EditorClipboardModel = Backbone.Model.extend({
        urlRoot: '/api/content/clip',
        initialize: function() {}
    });

    return EditorClipboardModel;

})
