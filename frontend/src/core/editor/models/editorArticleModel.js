define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');

    var PageArticleModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/article',

      initialize: function(options) {
        // TODO -- plug this in
        // this.set('articleCount', 4);
      }
    });

    return PageArticleModel;

});
