define(function(require) {

    var Backbone = require('backbone');

    var EditorClipboardModel = Backbone.Model.extend({
        urlRoot: '/api/content/clipboard',
        initialize: function() {}
    });

    return EditorClipboardModel;

});
