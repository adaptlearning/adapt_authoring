define(function(require){
    var Backbone = require('backbone');
    var ProjectContentModel = require('coreJS/dashboard/models/projectContentModel');

    var ProjectContentCollection = Backbone.Collection.extend({

      model: ProjectContentModel,

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