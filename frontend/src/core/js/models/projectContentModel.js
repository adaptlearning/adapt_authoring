//@TODO course|project
define(["backbone", "coreJS/adaptbuilder"], function(Backbone, AdaptBuilder) {

    var ProjectModel = Backbone.Model.extend({

      defaults: {
        type:'page' //@todo best default
      },

      initialize: function(options) {
          this.on('sync', this.loadedData, this);
      },

      url: function () {
        var stRet = '/api/content/'+ this.type + '/';

        if(this.isNew()){
          return stRet;
        } else {
          return stRet + this.id;
        }
      },

      loadedData: function() {
          console.log('course content model loaded');
          AdaptBuilder.trigger('loaded:data');
      }

    });

    return ProjectModel;

});