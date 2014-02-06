//@TODO course|project
define(["backbone", "coreJS/adaptbuilder", "coreModels/projectModel"], function(Backbone, AdaptBuilder, ProjectModel) {

    var ProjectCollection = Backbone.Collection.extend({

      model: ProjectModel,

      //url: '/data/projects.json',
      url:'api/content/Course',

      initialize : function(){
          this.fetch({reset:true});
      }

    });

    return ProjectCollection;

});