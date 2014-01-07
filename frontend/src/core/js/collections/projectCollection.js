define(["backbone", "coreJS/adaptbuilder", "coreModels/projectModel"], function(Backbone, AdaptBuilder, ProjectModel) {

    var ProjectCollection = Backbone.Collection.extend({

      model: ProjectModel,
      
      url: '/data/projects.json',
      
      initialize : function(){
          this.fetch({reset:true});
      }

    });

    return ProjectCollection;

});