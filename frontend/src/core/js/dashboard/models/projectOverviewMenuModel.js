define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/adaptbuilder');

    var ProjectOverviewMenuModel = Backbone.Model.extend({

      defaults: {
        context: 'Course',
        menus: {
          'page'      : true,
          'menu'      : true,
          'article'   : false,
          'block'     : false,
          'component' : false
        }
      },

      initialize: function(options) {

      },

      url: false

    });

    return ProjectOverviewMenuModel;

});