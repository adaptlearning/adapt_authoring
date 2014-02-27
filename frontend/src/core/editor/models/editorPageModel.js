define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/app/adaptbuilder');

    var PageModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/contentObject'

    });

    return PageModel;

});
