//@TODO course|project
define(["backbone", "coreJS/adaptbuilder"], function(Backbone, AdaptBuilder) {

    var ProjectModel = Backbone.Model.extend({

      idAttribute: '_id',

      initialize: function(options) {
          this.on('sync', this.loadedData, this);
      },

      url: function () {

        if(!this.get('id')){
          return '/api/content/course';
        } else {
          return '/api/content/course/' + this.get('id'); //@todo : could be clevererer
        }
      },

      loadedData: function() {
          console.log('course model loaded');
          AdaptBuilder.trigger('loaded:data');
      }

    });

    return ProjectModel;

});