//@TODO course|project
define(["backbone", "coreJS/adaptbuilder", "coreModels/projectContentModel"], function(Backbone, AdaptBuilder, ProjectContentModel) {

    var ProjectContentCollection = Backbone.Collection.extend({

      model: ProjectContentModel,

      //url: '/data/projects.json',
      url: function () {
        return 'api/content/contentobject?projectid=' + this.projectid;
      },

      initialize : function(options){
          if( options.projectid ){
            this.projectid = options.projectid;
          }

          this.fetch({reset:true});
      }

    });

    return ProjectContentCollection;

});