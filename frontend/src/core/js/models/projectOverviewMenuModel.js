//@TODO course|project
define(["backbone", "coreJS/adaptbuilder"], function(Backbone, AdaptBuilder) {

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