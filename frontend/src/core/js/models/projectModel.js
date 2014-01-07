define(["backbone", "coreJS/adaptbuilder"], function(Backbone, AdaptBuilder) {

    var ProjectModel = Backbone.Model.extend({
    
      initialize: function(options) {
          this.on('sync', this.loadedData, this);
      },
      
      loadedData: function() {
          console.log('course model loaded');
          AdaptBuilder.trigger('loaded:data');
      }
    
    });
    
    return ProjectModel;

});