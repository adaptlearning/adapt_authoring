define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/app/adaptbuilder');

    var PageArticleModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/article'

    });

    return PageArticleModel;

});
