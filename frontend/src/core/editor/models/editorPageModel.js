define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');

    var PageModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/contentObject'

    });

    return PageModel;

});
