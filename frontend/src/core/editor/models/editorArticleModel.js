define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');

    var PageArticleModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/article'

    });

    return PageArticleModel;

});
