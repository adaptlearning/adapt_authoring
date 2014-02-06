//@TODO course|project
define(["backbone", "coreJS/adaptbuilder", "coreModels/projectModel"], function(Backbone, AdaptBuilder, ProjectModel) {

    var ProjectCollection = Backbone.Collection.extend({

      model: ProjectModel,

      url:'api/content/course'

    });

    return ProjectCollection;

});